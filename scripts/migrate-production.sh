#!/bin/bash

# Production Database Migration Script
# Run this after deploying to Vercel to set up your database

echo "==================================="
echo "WhiteCircle - Production Migration"
echo "==================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo "This script will:"
echo "1. Pull production environment variables"
echo "2. Run Prisma migrations on your production database"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo "📥 Pulling production environment variables..."
vercel env pull .env.production --yes

if [ ! -f .env.production ]; then
    echo "❌ Failed to pull environment variables"
    exit 1
fi

echo "✅ Environment variables pulled"
echo ""

echo "🔄 Running database migrations..."
cd frontend

# Load production env and run migrations
export $(cat ../.env.production | xargs)
pnpm prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "Your production database is now set up."
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

# Clean up
cd ..
rm .env.production

echo ""
echo "🧹 Cleaned up temporary files"
echo ""
echo "==================================="
echo "Done!"
echo "==================================="

