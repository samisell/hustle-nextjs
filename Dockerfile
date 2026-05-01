FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json prisma ./
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm ci

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

# Copy EVERYTHING from builder to ensure all dependencies are present
COPY --from=builder /app ./

RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

# Use the simplest command to run the DB sync and start the app
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
