#!/bin/bash

# ===========================================
# Generate Secure Tokens for Production
# ===========================================

echo "🔑 Generating secure tokens for production deployment..."
echo ""

# Generate tokens
INTERNAL_TOKEN=$(openssl rand -hex 32)
REVALIDATION_TOKEN=$(openssl rand -hex 32)

echo "🎯 Generated secure tokens:"
echo "================================"
echo ""
echo "CREDENTIAL_INTERNAL_TOKEN:"
echo "$INTERNAL_TOKEN"
echo ""
echo "REVALIDATION_TOKEN:"
echo "$REVALIDATION_TOKEN"
echo ""

# Update .env.production file
if [[ -f ".env.production" ]]; then
    echo "📝 Updating .env.production with generated tokens..."
    
    # Replace template values with actual tokens
    sed -i.bak "s/your-secure-internal-token-here/$INTERNAL_TOKEN/g" .env.production
    sed -i.bak "s/your-secure-revalidation-token-here/$REVALIDATION_TOKEN/g" .env.production
    
    echo "✅ .env.production updated with secure tokens"
    
    # Show what still needs to be updated manually
    echo ""
    echo "⚠️  Still need to update manually in .env.production:"
    echo "   - DATABASE_URL (your Neon.tech blog database connection string)"
    echo ""
    
    # Check if Neon.tech URL is set
    if grep -q "ep-.*\..*\.aws\.neon\.tech" .env.production; then
        echo "✅ Neon.tech DATABASE_URL appears to be configured"
    else
        echo "❌ Please update DATABASE_URL with your Neon.tech blog database connection string"
        echo "   It should look like: postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/blogdb?sslmode=require"
    fi
else
    echo "❌ .env.production file not found"
    exit 1
fi

echo ""
echo "🎯 IMPORTANT: Update your credentials app with the same INTERNAL_TOKEN:"
echo "   In Railway dashboard → Variables → Update INTERNAL_SERVICE_TOKEN to:"
echo "   $INTERNAL_TOKEN"
echo ""
echo "📋 Next steps:"
echo "1. Update DATABASE_URL in .env.production with your Neon.tech blog database URL"
echo "2. Update INTERNAL_SERVICE_TOKEN in Railway credentials app to match"
echo "3. Deploy blog app to Vercel with these environment variables"
