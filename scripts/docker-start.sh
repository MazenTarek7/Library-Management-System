#!/bin/sh
set -e

echo "[entrypoint] Running prisma generate..."
npx prisma generate

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  node src/scripts/setupDatabase.js seed || true
fi

echo "[entrypoint] Starting app..."
exec npm run dev
