import { rateLimitConfig } from '@kiro/config';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AccountsModule } from './accounts/accounts.module';
import { AssetsModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { createWinstonLogger } from './common/logger/winston.config';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { HrModule } from './hr/hr.module';
import { InventoryModule } from './inventory/inventory.module';
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { SalesCRMModule } from './sales-crm/sales-crm.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Logging
    WinstonModule.forRoot({
      instance: createWinstonLogger(),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: rateLimitConfig.windowMs,
        limit: rateLimitConfig.max,
      },
    ]),

    // GraphQL with Apollo Federation
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      playground: process.env.NODE_ENV === 'development',
      introspection: process.env.NODE_ENV === 'development',
      context: ({ request, reply }) => ({ request, reply }),
      formatError: error => {
        // Log GraphQL errors
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code,
          timestamp: new Date().toISOString(),
          path: error.path,
        };
      },
      plugins: [],
    }),

    // Feature Modules
    HealthModule,
    AuthModule,
    AccountsModule,
    CustomersModule,
    VendorsModule,
    InventoryModule,
    ManufacturingModule,
    HrModule,
    SalesCRMModule,
    AssetsModule,
  ],
})
export class AppModule {}
