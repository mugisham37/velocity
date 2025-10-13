import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),

  // Database Configuration
  DATABASE_URL: z.string().url(),
  TIMESCALE_URL: z.string().url(),

  // Redis Configuration
  REDIS_URL: z.string().url(),

  // Elasticsearch Configuration
  ELASTICSEARCH_URL: z.string().url(),

  // S3/MinIO Configuration
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // OAuth2 Configuration (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // SAML Configuration (optional)
  SAML_ENTRY_POINT: z.string().url().optional(),
  SAML_ISSUER: z.string().optional(),
  SAML_CERT: z.string().optional(),

  // Email Configuration
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),

  // SMS Configuration (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Application URLs
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),

  // Monitoring and Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().url().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Validate and export configuration
export const config = envSchema.parse(process.env);

// Type export for TypeScript
export type Config = z.infer<typeof envSchema>;

// Configuration validation function
export function validateConfig(): Config {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Database configuration
export const databaseConfig = {
  url: config.DATABASE_URL,
  timescaleUrl: config.TIMESCALE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
};

// Redis configuration
export const redisConfig = {
  url: config.REDIS_URL,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
};

// JWT configuration
export const jwtConfig = {
  secret: config.JWT_SECRET,
  refreshSecret: config.JWT_REFRESH_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
};

// OAuth2 configuration
export const oauthConfig = {
  google: {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
  },
  microsoft: {
    clientId: config.MICROSOFT_CLIENT_ID,
    clientSecret: config.MICROSOFT_CLIENT_SECRET,
  },
  github: {
    clientId: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
  },
};

// SAML configuration
export const samlConfig = {
  entryPoint: config.SAML_ENTRY_POINT,
  issuer: config.SAML_ISSUER,
  cert: config.SAML_CERT,
};

// Email configuration
export const emailConfig = {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
};

// SMS configuration
export const smsConfig = {
  accountSid: config.TWILIO_ACCOUNT_SID,
  authToken: config.TWILIO_AUTH_TOKEN,
  phoneNumber: config.TWILIO_PHONE_NUMBER,
};

// S3 configuration
export const s3Config = {
  endpoint: config.S3_ENDPOINT,
  accessKeyId: config.S3_ACCESS_KEY,
  secretAccessKey: config.S3_SECRET_KEY,
  bucketName: config.S3_BUCKET_NAME,
  region: 'us-east-1', // Default region for MinIO
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
};

// CORS configuration
export const corsConfig = {
  origin: config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
