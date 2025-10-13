import { rateLimitConfig } from '@kiro/config';
import { ApolloFederationDriver } from '@nestjs/apollo';
import type { ApolloFederationDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AccountsModule } from './accounts/accounts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AssetsModule } from './assets/assets.module';
import { AuthModule } from './auth/auth.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { CommonModule } from './common/common.module';
import { createWinstonLogger } from './common/logger/winston.config';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { HrModule } from './hr/hr.module';
import { InventoryModule } from './inventory/inventory.module';
import { IoTModule } from './iot/iot.module';
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { PerformanceModule } from './performance/performance.module';
import { ReportsModule } from './reports/reports.module';
import { SalesCRMModule } from './sales-crm/sales-crm.module';
import { SecurityModule } from './security/security.module';
import { VendorsModule } from './vendors/vendors.module';
import { WorkflowsModule } from './workflows/workflows.module';

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
      playground: process.env['NODE_ENV'] === 'development',
      introspection: process.env['NODE_ENV'] === 'development',
      context: ({ request, reply }: { request: any; reply: any }) => ({
        request,
        reply,
      }),
      formatError: (formattedError, error) => {
        // Log GraphQL errors
        console.error('GraphQL Error:', error);
        return {
          message: formattedError.message,
          code: formattedError.extensions?.['code'],
          timestamp: new Date().toISOString(),
          path: formattedError.path || [],
        };
      },
      plugins: [],
    }),

    // Performance and Infrastructure
    CommonModule,
    PerformanceModule,

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
    AnalyticsModule,
    IoTModule,
    WorkflowsModule,
    SecurityModule,
    CollaborationModule,
    ReportsModule,
  ],
})
export class AppModule {}

