// Load dotenv only if available (not needed in Docker where env vars are injected)
try { require("dotenv/config") } catch {}

import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
