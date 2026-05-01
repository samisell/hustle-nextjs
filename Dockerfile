FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV NPM_CONFIG_OFFLINE=false \
    NPM_CONFIG_PREFER_OFFLINE=false \
    NPM_CONFIG_PREFER_ONLINE=true \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm ci --no-audit --no-fund --prefer-online --prefer-offline=false --offline=false

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

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/effect ./node_modules/effect
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/db ./db

RUN chown -R nextjs:nextjs /app
RUN mkdir -p /home/nextjs && chown nextjs:nextjs /home/nextjs
USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
