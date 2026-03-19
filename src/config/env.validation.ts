import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';

  // Database
  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value as string, 10))
  DATABASE_PORT!: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD!: string;

  @IsString()
  @IsOptional()
  DATABASE_SCHEMA: string = 'public';

  @IsOptional()
  @Transform(({ value }) => value === '1' || value === 'true')
  DATABASE_SYNC: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === '1' || value === 'true')
  DATABASE_DEBUG: boolean = false;

  // JWT
  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  // Redis
  @IsString()
  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value as string, 10))
  REDIS_PORT!: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsString()
  @IsOptional()
  REDIS_DB: string = '0';

  // Swagger
  @IsString()
  @IsOptional()
  SWAGGER_USERNAME?: string;

  @IsString()
  @IsOptional()
  SWAGGER_PASSWORD?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated_config = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validated_config, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated_config;
}
