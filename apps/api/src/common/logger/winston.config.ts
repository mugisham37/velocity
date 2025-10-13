import * as winston from 'winston';
import { config } from '@kiro/config';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for development
const developmentFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

// Custom format for production
const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export function createWinstonLogger(): winston.Logger {
  const isDevelopment = config.NODE_ENV === 'development';
  
  return winston.createLogger({
    level: config.LOG_LEVEL,
    format: isDevelopment 
      ? combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          developmentFormat
        )
      : productionFormat,
    defaultMeta: {
      service: 'kiro-api',
      environment: config.NODE_ENV,
    },
    transports: [
      // Console transport
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
      
      // File transports for production
      ...(config.NODE_ENV === 'production' ? [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          handleExceptions: true,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          handleExceptions: true,
        }),
      ] : []),
    ],
    exitOnError: false,
  });
}
