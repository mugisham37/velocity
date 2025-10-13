import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

@Injectable()
export class DatabaseService {
  private client: postgres.Sql;
  public db: ReturnType<typeof drizzle>;
  public query: typeof schema;

  constructor() {
    // Initialize PostgreSQL connection
    this.client = postgres(
      process.env['DATABASE_URL'] || 'postgresql://postgres:moses@localhost:5432/velocity',
      {
        max: 20,
        idle_timeout: 20,
        connect_timeout: 10,
      }
    );

    // Create Drizzle database instance
    this.db = drizzle(this.client, { schema });
    this.query = schema;
  }

  // Convenience methods for common operations
  insert<T extends keyof typeof schema>(table: T) {
    return this.db.insert(schema[table]);
  }

  update<T extends keyof typeof schema>(table: T) {
    return this.db.update(schema[table]);
  }

  delete<T extends keyof typeof schema>(table: T) {
    return this.db.delete(schema[table]);
  }

  select<T extends keyof typeof schema>(table: T) {
    return this.db.select().from(schema[table]);
  }

  // Query builder access
  get query() {
    return this.db.query;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Close connection
  async close(): Promise<void> {
    await this.client.end();
  }
}

