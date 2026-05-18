import "dotenv/config"
import { defineConfig } from "prisma/config"
import { getRequiredDatabaseUrl } from "./src/lib/database-url"

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: getRequiredDatabaseUrl(),
  },
})
