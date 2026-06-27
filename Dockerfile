# syntax=docker/dockerfile:1

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

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

USER node

COPY --from=build --chown=node:node /app/.output /app/.output

EXPOSE 3000

CMD ["node", "/app/.output/server/index.mjs"]
