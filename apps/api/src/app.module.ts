import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AccountsModule } from './accounts/accounts.module';
import { CustomersModule } from './customers/customers.module';
import { VendorsModule } from './vendors/vendors.module';
import { ItemsModule } from './items/items.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { createWinstonLogger } from './common/logger/winston.config';
import { rateLimitConfig } from '@kiro/config';

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
    ThrottlerModule.forRoot([{
      ttl: rateLimitConfig.windowMs,
      limit: rateLimitConfig.max,
    }]),

    // GraphQL with Apollo Federation
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      playground: process.env.NODE_ENV === 'development',
      introspection: process.env.NODE_ENV === 'development',
      context: ({ request, reply }) => ({ request, reply }),
      formatError: (error) => {
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
    UsersModule,
    CompaniesModule,
    AccountsModule,
    CustomersModule,
    VendorsModule,
    ItemsModule,
    WarehousesModule,
  ],
})
export class AppModule {}