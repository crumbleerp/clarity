#!/bin/sh
set -e

node /app/migrate.mjs
exec node /app/.output/server/index.mjs
