#!/bin/sh
set -e
if [ "$DB_PROVIDER" = "postgresql" ]; then
  # As migracoes versionadas sao do SQLite; no Postgres o schema e sincronizado com db push.
  npx prisma db push --skip-generate
else
  npx prisma migrate deploy
fi
exec "$@"
