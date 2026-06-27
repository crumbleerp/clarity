FROM node:22-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_OPTIONS='--max-old-space-size=4096'
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

RUN mkdir -p /app/migrate-deps \
 && cp -rL /app/node_modules/postgres /app/migrate-deps/postgres \
 && cp -rL /app/node_modules/drizzle-orm /app/migrate-deps/drizzle-orm

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

USER node

COPY --from=build --chown=node:node /app/.output /app/.output
COPY --from=build --chown=node:node /app/migrate-deps /app/node_modules
COPY --from=build --chown=node:node /app/server/db/migrations /app/migrations
COPY --chown=node:node scripts/migrate.mjs /app/migrate.mjs
COPY --chown=node:node entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
