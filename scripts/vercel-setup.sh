#!/bin/bash

# Vercel Setup Script for WhiteCircle
# This script helps you set up environment variables for Vercel deployment

echo "==================================="
echo "WhiteCircle - Vercel Setup Script"
echo "==================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed."
    echo "Install it with: npm i -g vercel"
    echo ""
    read -p "Would you like to install it now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        npm i -g vercel
    else
        echo "Please install Vercel CLI and run this script again."
        exit 1
    fi
fi

echo "✅ Vercel CLI is installed"
echo ""

# Login to Vercel
echo "Logging in to Vercel..."
vercel login

echo ""
echo "==================================="
echo "Setting up environment variables"
echo "==================================="
echo ""

# Get OpenAI API Key
echo "📝 Enter your OpenAI API Key:"
echo "   (Get it from: https://platform.openai.com/api-keys)"
read -p "OPENAI_API_KEY: " OPENAI_API_KEY

# Get Database URL
echo ""
echo "📝 Enter your PostgreSQL Database URL:"
echo "   (For Vercel Postgres, create one in your project dashboard)"
echo "   Format: postgresql://user:password@host:port/database?sslmode=require"
read -p "DATABASE_URL: " DATABASE_URL

# Confirm
echo ""
echo "==================================="
echo "Summary"
echo "==================================="
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo ""

read -p "Do you want to set these environment variables? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "Setting environment variables..."
    
    # Set environment variables for production
    vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"
    vercel env add DATABASE_URL production <<< "$DATABASE_URL"
    
    # Set environment variables for preview
    vercel env add OPENAI_API_KEY preview <<< "$OPENAI_API_KEY"
    vercel env add DATABASE_URL preview <<< "$DATABASE_URL"
    
    echo ""
    echo "✅ Environment variables set successfully!"
    echo ""
    echo "==================================="
    echo "Next Steps"
    echo "==================================="
    echo "1. Deploy your project: vercel --prod"
    echo "2. Or push to your Git repository for automatic deployment"
    echo "3. Run database migrations after first deployment"
    echo ""
else
    echo "Setup cancelled."
    exit 1
fi

