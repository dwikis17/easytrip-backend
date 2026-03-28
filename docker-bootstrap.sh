#!/bin/sh

# Exit on error
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting application..."
npm start
