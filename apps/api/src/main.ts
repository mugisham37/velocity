import helmet from '@fastify/helmet';
import { validateConfig } from './config';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { createWinstonLogger } from './common/logger/winston.config';

async function bootstrap() {
  // Validate configuration before starting
  const config = validateConfig();

  // Create Winston logger
  const logger = createWinstonLogger();

  // Create Fastify adapter with options
  const fastifyAdapter = new FastifyAdapter({
    logger: false, // We'll use Winston instead
    trustProxy: true,
    bodyLimit: 10485760, // 10MB
  });

  // Create NestJS application
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      logger: WinstonModule.createLogger({
        instance: logger,
      }),
    }
  );

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security middleware
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        scriptSrc: [`'self'`],
        objectSrc: [`'none'`],
        upgradeInsecureRequests: [],
      },
    },
  });

  // CORS configuration
  await app.register(require('@fastify/cors'), {
    origin: configService
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TransformInterceptor(),
    app.get('PerformanceInterceptor')
  );

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Start the application
  await app.listen(port, '0.0.0.0');

  logger.info(`🚀 KIRO ERP API is running on port ${port} in ${nodeEnv} mode`);
  logger.info(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
  logger.info(`🏥 Health Check: http://localhost:${port}/health`);
}

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

