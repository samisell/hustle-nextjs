FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl build-essential python3 make && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps --ignore-scripts

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="mysql://hustle:hustlepass@mysql:3306/hustle"
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system nextjs && useradd --system --gid nextjs nextjs

# Set up the standalone server structure
# 1. Copy the standalone files
COPY --from=builder /app/.next/standalone ./
# 2. Copy the static files into the expected location
COPY --from=builder /app/.next/static ./.next/static
# 3. Copy the public folder
COPY --from=builder /app/public ./public
# 4. Copy node_modules/prisma for the runtime db sync
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/effect ./node_modules/effect
COPY --from=builder /app/node_modules/fast-check ./node_modules/fast-check
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

# Start with the correct standalone server path (now at the root)
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --accept-data-loss && node server.js"]
