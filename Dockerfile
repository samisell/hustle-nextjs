FROM node:22-bookworm-slim AS deps
WORKDIR /app

# Install build dependencies and openssl
RUN apt-get update -y && apt-get install -y openssl build-essential python3 make && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies but IGNORE scripts (prevents prisma generate from failing here)
RUN npm install --legacy-peer-deps --ignore-scripts

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set a dummy DATABASE_URL for the build phase
ENV DATABASE_URL="mysql://hustle:hustlepass@mysql:3306/hustle"

# Now run the prisma generate and build
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system nextjs && useradd --system --gid nextjs nextjs

# Copy the built application
COPY --from=builder /app ./

RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

# Run DB sync and start
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
