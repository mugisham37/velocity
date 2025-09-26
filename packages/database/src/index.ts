import { databaseConfig } from '@kiro/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create PostgreSQL connection
const client = postgres(databaseConfig.url, {
  max: databaseConfig.pool.max,
  idle_timeout: databaseConfig.pool.idleTimeoutMillis / 1000,
  connect_timeout: databaseConfig.pool.acquireTimeoutMillis / 1000,
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Create TimescaleDB connection for IoT data
const timescaleClient = postgres(databaseConfig.timescaleUrl, {
  max: databaseConfig.pool.max,
  idle_timeout: databaseConfig.pool.idleTimeoutMillis / 1000,
  connect_timeout: databaseConfig.pool.acquireTimeoutMillis / 1000,
});

export const timescaleDb = drizzle(timescaleClient);

// Export schema and types
export * from './database.module';
export * from './database.service';
export * from './schema';
export type Database = typeof db;
export type TimescaleDatabase = typeof timescaleDb;

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close database connections
export async function closeDatabaseConnections(): Promise<void> {
  await client.end();
  await timescaleClient.end();
}
