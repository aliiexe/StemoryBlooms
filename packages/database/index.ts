import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import * as relations from './relations';

neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema: { ...schema, ...relations } });

export * from './schema';
export * from './relations';
export { eq, sql, inArray, isNull, isNotNull, and, or, not, desc, asc, lte, gte } from 'drizzle-orm';
