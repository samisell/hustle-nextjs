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

# Copy EVERYTHING from builder to ensure all dependencies for Prisma and Next.js are present
COPY --from=builder /app ./

# Fix for Next.js standalone: Copy static/public assets into the standalone directory so they are served
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
RUN cp -r public .next/standalone/public 2>/dev/null || true

RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

# Start with the prisma sync and the standalone server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --accept-data-loss && node .next/standalone/server.js"]
