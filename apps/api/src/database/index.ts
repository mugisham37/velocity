import { databaseConfig } from '../config';
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

// Export drizzle-orm functions to ensure consistent types across the monorepo
export {
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  exists,
  notExists,
  between,
  notBetween,
  like,
  notLike,
  ilike,
  notIlike,
  sql,
  placeholder,
  asc,
  desc,
} from 'drizzle-orm';

// Create aggregate functions using sql template
import { sql as sqlTemplate } from 'drizzle-orm';
export const count = (column?: any) => sqlTemplate`COUNT(${column || sqlTemplate`*`})`;
export const countDistinct = (column: any) => sqlTemplate`COUNT(DISTINCT ${column})`;
export const avg = (column: any) => sqlTemplate`AVG(${column})`;
export const sum = (column: any) => sqlTemplate`SUM(${column})`;
export const max = (column: any) => sqlTemplate`MAX(${column})`;
export const min = (column: any) => sqlTemplate`MIN(${column})`;

export type { SQL } from 'drizzle-orm';
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

