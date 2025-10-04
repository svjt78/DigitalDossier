#!/bin/bash

# Deploy Blog App Database to Neon
# This script deploys Prisma schema changes to the Neon production database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Blog App - Deploy to Neon Database${NC}"
echo "=================================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please create .env.production with your Neon database connection string"
    exit 1
fi

# Load production environment variables
echo -e "${YELLOW}📄 Loading production environment...${NC}"
export DATABASE_URL=$(grep '^DATABASE_URL=' .env.production | cut -d '=' -f2-)

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not found in .env.production${NC}"
    echo "Please ensure DATABASE_URL is set in .env.production"
    exit 1
fi

# Extract database name from URL for logging
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo -e "${BLUE}📊 Target Database: ${DB_NAME}${NC}"

# Check if Prisma CLI is available
if ! command -v npx prisma &> /dev/null; then
    echo -e "${RED}❌ Error: Prisma CLI not found${NC}"
    echo "Please install Prisma: npm install prisma"
    exit 1
fi

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
DOTENV_CONFIG_PATH=/dev/null npx prisma generate

# Check database connection
echo -e "${YELLOW}🔌 Testing database connection...${NC}"
if ! DOTENV_CONFIG_PATH=/dev/null npx prisma db pull --force > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo "Please check your DATABASE_URL in .env.production"
    exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"

# Show migration status
echo -e "${YELLOW}📋 Checking migration status...${NC}"
DOTENV_CONFIG_PATH=/dev/null npx prisma migrate status

# Prompt for confirmation
echo ""
echo -e "${YELLOW}⚠️  This will apply pending migrations to the PRODUCTION database${NC}"
echo -e "${BLUE}Database: ${DB_NAME}${NC}"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Deployment cancelled${NC}"
    exit 0
fi

# Deploy migrations
echo -e "${YELLOW}🚀 Deploying migrations to Neon...${NC}"
DOTENV_CONFIG_PATH=/dev/null npx prisma migrate deploy

# Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
DOTENV_CONFIG_PATH=/dev/null npx prisma migrate status

# Generate fresh client for production
echo -e "${YELLOW}🔧 Regenerating Prisma Client for production...${NC}"
DOTENV_CONFIG_PATH=/dev/null npx prisma generate

echo ""
echo -e "${GREEN}🎉 Success! Database deployed to Neon${NC}"
echo -e "${GREEN}✅ All migrations applied successfully${NC}"
echo -e "${BLUE}📊 Database: ${DB_NAME}${NC}"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "   • Update your Vercel environment variables with the new DATABASE_URL if changed"
echo "   • Deploy your application to ensure it works with the updated database"
echo "   • Monitor your application for any issues"
echo ""
echo -e "${BLUE}🔗 Neon Dashboard: https://console.neon.tech${NC}"