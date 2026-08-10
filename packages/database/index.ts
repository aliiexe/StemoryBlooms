import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import * as relations from './relations';

neonConfig.webSocketConstructor = WebSocket;

// Cache the database connection in development to prevent connection exhaustion during Hot Module Replacement (HMR)
const globalForDb = globalThis as unknown as { pool: Pool | undefined };

const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL! });
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

export * from './schema';
export * from './relations';
export { eq, sql, inArray, isNull, isNotNull, and, or, not, desc, asc, lte, gte } from 'drizzle-orm';

import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
