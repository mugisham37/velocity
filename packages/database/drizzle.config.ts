import type { Config } from 'drizzle-kit';
import { config } from '@kiro/config';

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: config.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;