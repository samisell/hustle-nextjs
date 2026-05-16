import { PrismaPlanetScale } from '@prisma/adapter-planetscale'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set')
}

function shouldUsePlanetScaleAdapter(databaseUrl: string): boolean {
  try {
    const host = new URL(databaseUrl).hostname.toLowerCase()
    return host.includes('psdb.cloud') || host.includes('planetscale.com')
  } catch {
    return false
  }
}

const databaseUrl = process.env.DATABASE_URL
const usePlanetScaleAdapter = shouldUsePlanetScaleAdapter(databaseUrl)

const adapter = usePlanetScaleAdapter
  ? new PrismaPlanetScale({
      url: databaseUrl,
    })
  : undefined

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(adapter ? { adapter } : {}),
    log: process.env.NODE_ENV !== 'production' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
