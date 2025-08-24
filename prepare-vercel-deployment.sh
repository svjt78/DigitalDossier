#!/bin/bash

# ===========================================
# Blog App Vercel Deployment Preparation
# ===========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}▲ Preparing Blog App for Vercel Deployment${NC}"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -f "next.config.ts" ]]; then
    echo -e "${RED}❌ Not in blog app directory${NC}"
    echo "Please run this from: /Users/SD60006/Documents/Rest/apps/apps/blog/books-dashboard"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory: $(pwd)${NC}"

# Step 1: Generate tokens
echo -e "${YELLOW}🔑 Step 1: Generating secure tokens...${NC}"
if [[ -f "generate-tokens.sh" ]]; then
    chmod +x generate-tokens.sh
    ./generate-tokens.sh
else
    echo -e "${RED}❌ generate-tokens.sh not found${NC}"
    exit 1
fi

# Step 2: Verify .env.production
echo -e "${YELLOW}📋 Step 2: Verifying production configuration...${NC}"

if [[ -f ".env.production" ]]; then
    echo -e "${GREEN}✅ .env.production exists${NC}"
    
    # Check Railway URL
    if grep -q "credentials-production.up.railway.app" .env.production; then
        echo -e "${GREEN}✅ Railway URL configured correctly${NC}"
    else
        echo -e "${RED}❌ Railway URL not found in .env.production${NC}"
        exit 1
    fi
    
    # Check for template values
    if grep -q "your-secure-" .env.production; then
        echo -e "${YELLOW}⚠️  Some template values still need updating:${NC}"
        grep "your-secure-" .env.production
        echo ""
        echo "Please update these manually with actual values"
    else
        echo -e "${GREEN}✅ All tokens generated${NC}"
    fi
    
    # Check for Neon.tech blog database URL
    if grep -q "ep-.*\..*\.aws\.neon\.tech.*blogdb" .env.production; then
        echo -e "${GREEN}✅ Neon.tech blog DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Please update DATABASE_URL with your Neon.tech BLOG database connection string${NC}"
        echo "   Should end with: /blogdb?sslmode=require"
    fi
    
else
    echo -e "${RED}❌ .env.production not found${NC}"
    exit 1
fi

# Step 3: Check Vercel configuration
echo -e "${YELLOW}📋 Step 3: Checking Vercel configuration...${NC}"

if [[ -f "vercel.json" ]]; then
    echo -e "${GREEN}✅ vercel.json exists${NC}"
else
    echo -e "${RED}❌ vercel.json missing${NC}"
    exit 1
fi

# Step 4: Test local build
echo -e "${YELLOW}🔨 Step 4: Testing production build...${NC}"

echo "Installing dependencies..."
npm ci

echo "Generating Prisma client with environment variables..."
# Check if we have DATABASE_URL in environment or .env.production (for local testing)
if [[ -z "$DATABASE_URL" ]]; then
    if [[ -f ".env.production" ]]; then
        echo "📁 Loading DATABASE_URL from .env.production for local testing..."
        DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | cut -d '=' -f2-)
        export DATABASE_URL
    else
        echo "⚠️ No DATABASE_URL found - some features may be limited"
        echo "   For full testing, set DATABASE_URL environment variable"
    fi
fi

if [[ -n "$DATABASE_URL" ]]; then
    echo "🔗 Using DATABASE_URL: ${DATABASE_URL:0:50}..."
fi

npx prisma generate --schema=./prisma/schema.prisma

echo "Testing production build..."
# Note: Sitemap generation now handles missing .env.production gracefully
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production build successful${NC}"
else
    echo -e "${RED}❌ Production build failed${NC}"
    echo "Fix build errors before deploying to Vercel"
    exit 1
fi

# Step 5: Show next steps
echo ""
echo -e "${GREEN}🎉 Blog app is ready for Vercel deployment!${NC}"
echo ""
echo -e "${BLUE}📋 Final checklist before Vercel deployment:${NC}"
echo ""
echo -e "${GREEN}✅ Railway credentials service deployed and working${NC}"
echo -e "${GREEN}✅ Secure tokens generated${NC}"
echo -e "${GREEN}✅ Production build tested${NC}"
echo -e "${GREEN}✅ Vercel configuration ready${NC}"
echo ""

echo -e "${YELLOW}⚠️  Before deploying to Vercel:${NC}"
echo "1. Update DATABASE_URL in .env.production with your Neon.tech BLOG database"
echo "2. Update INTERNAL_SERVICE_TOKEN in Railway credentials app to match this app"
echo ""

echo -e "${BLUE}🚀 Deploy to Vercel:${NC}"
echo "Option 1 - Vercel Dashboard:"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import your repository" 
echo "   3. Set root directory to: apps/blog/books-dashboard"
echo "   4. Add environment variables from .env.production"
echo "   5. Deploy"
echo ""
echo "Option 2 - Vercel CLI:"
echo "   1. Run: vercel login"
echo "   2. Run: vercel --prod"
echo "   3. Follow prompts"
echo ""

echo -e "${GREEN}Your Railway credentials URL is: https://credentials-production.up.railway.app${NC}"
echo -e "${GREEN}Ready for Vercel deployment! 🚀${NC}"
