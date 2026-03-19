import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { TransactionMiddleware } from '@common/middlewares/transaction.middleware';
import { MikroORM } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import compression from 'compression';
import expressBasicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

interface ValidationErrorDetail {
  field: string;
  value: unknown;
  constraints: string[];
  children?: ValidationErrorDetail[];
}

function formatValidationErrors(
  validation_errors: ValidationError[],
): ValidationErrorDetail[] {
  return validation_errors.map((validation_error) => ({
    field: validation_error.property,
    value: validation_error.value,
    constraints: validation_error.constraints
      ? Object.values(validation_error.constraints)
      : [],
    children:
      validation_error.children && validation_error.children.length > 0
        ? formatValidationErrors(validation_error.children)
        : undefined,
  }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const config_service = app.get(ConfigService);

  // Sync database
  if (config_service.get<boolean>('DATABASE_SYNC', false)) {
    const orm = app.get(MikroORM);
    await orm.schema.updateSchema({
      safe: true,
      dropDb: false,
      dropTables: false,
    });
  }

  // Middlewares
  app.enableCors({
    origin: config_service.get<string>('CORS_ORIGIN'),
    credentials: true,
  });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  const transaction_middleware = new TransactionMiddleware();
  app.use(transaction_middleware.use.bind(transaction_middleware));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (validation_errors: ValidationError[] = []) =>
        new BadRequestException(formatValidationErrors(validation_errors)),
    }),
  );

  app.useLogger(app.get(PinoLogger));
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      ['/docs', '/docs-json'],
      expressBasicAuth({
        challenge: true,
        users: {
          [config_service.getOrThrow<string>('SWAGGER_USERNAME')]:
            config_service.getOrThrow<string>('SWAGGER_PASSWORD'),
        },
      }),
    );
    const config = new DocumentBuilder()
      .setTitle('API')
      .setDescription('API Description')
      .setVersion('1.0')
      .addBasicAuth()
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();
    const document_factory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document_factory);
  }

  // Start application on port
  const port = config_service.get<number>('PORT', 3000);
  const logger = new Logger(bootstrap.name);
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

void bootstrap();
