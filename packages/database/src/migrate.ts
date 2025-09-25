import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { databaseConfig } from '@kiro/config';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const migrationClient = postgres(databaseConfig.url, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export { runMigrations };