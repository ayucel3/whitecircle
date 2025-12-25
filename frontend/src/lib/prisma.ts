import { PrismaClient } from '../generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  pgPool: Pool;
};

// This helper creates the appropriate adapter based on the DATABASE_URL
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  let adapter;

  if (connectionString.startsWith('file:') || connectionString.startsWith('sqlite:')) {
    // Local SQLite setup
    const dbPath = connectionString.replace(/^(file:|sqlite:)/, '');
    adapter = new PrismaBetterSqlite3({ url: dbPath });
  } else {
    // PostgreSQL setup (for Vercel or local Postgres)
    const pool = globalForPrisma.pgPool || new Pool({ connectionString });
    if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;
    adapter = new PrismaPg(pool);
  }

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
