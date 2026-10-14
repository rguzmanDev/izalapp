# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# One-shot container that applies pending database migrations.
FROM deps AS migrator
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
CMD ["npx", "drizzle-kit", "migrate"]

FROM deps AS builder
COPY . .
# The database client is created on import; this placeholder is never connected to during the build.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN apk add --no-cache tzdata
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
