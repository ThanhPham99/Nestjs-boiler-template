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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('app');

  const CONFIG_SERVICE = app.get(ConfigService);

  // Sync database
  if (CONFIG_SERVICE.get<boolean>('DATABASE_SYNC', false)) {
    const orm = app.get(MikroORM);
    await orm.schema.updateSchema({
      safe: true,
      dropDb: false,
      dropTables: false,
    });
  }

  // Middlewares
  app.enableCors({
    origin: CONFIG_SERVICE.get<string>('CORS_ORIGIN'),
    credentials: true,
  });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(new TransactionMiddleware().use);
  app.use;
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formatErrors = (errors: ValidationError[]) => {
          return errors.map((err) => ({
            field: err.property, // Tên trường bị lỗi (vd: email)
            value: err.value, // Giá trị người dùng nhập (Tùy chọn, cân nhắc bảo mật)
            constraints: err.constraints
              ? (Object.values(err.constraints) as any)
              : [], // Chi tiết các lỗi (vd: { isEmail: '...', minLength: '...' })
            children:
              err.children && err.children.length > 0
                ? formatErrors(err.children)
                : undefined, // Lỗi lồng nhau
          }));
        };

        const formattedErrors = formatErrors(validationErrors);

        // Ném ra BadRequestException với cấu trúc lỗi mới
        return new BadRequestException(formattedErrors);
      },
    }),
  );
  app.useLogger(app.get(PinoLogger));
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));
  app.useGlobalFilters(new HttpExceptionFilter());
  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    app.use(
      ['/app/docs', '/app/docs-json'],
      expressBasicAuth({
        challenge: true,
        users: {
          [CONFIG_SERVICE.getOrThrow<string>('SWAGGER_USERNAME')]:
            CONFIG_SERVICE.getOrThrow<string>('SWAGGER_PASSWORD'),
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
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('app/docs', app, documentFactory);
  }

  // Start application on port
  const logger = new Logger(bootstrap.name);
  await app.listen(CONFIG_SERVICE.get<number>('PORT', 3000), () => {
    logger.log(`Application running on port ${CONFIG_SERVICE.get('PORT')}`);
  });
}

void bootstrap();
