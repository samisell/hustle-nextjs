import { PrismaClient } from '@prisma/client'
import { PrismaPlanetScale } from '@prisma/adapter-planetscale'
import mysql from 'mysql2/promise'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

// Create a connection pool
const pool = mysql.createPool({
  uri: connectionString,
})

// Create the adapter
const adapter = new PrismaPlanetScale(pool)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db