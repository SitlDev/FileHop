#!/bin/bash
# Railway Backend Setup Helper
# This script helps verify and configure Railway environment variables

echo "🔍 StarPath Backend Railway Setup Helper"
echo "==========================================="
echo ""

# Check if we have access to Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "   npm install -g @railway/cli"
    echo ""
    echo "Then authenticate:"
    echo "   railway login"
    exit 1
fi

echo "📋 Current Railway Variables for StarPath Backend:"
echo ""
railway variables --project 99a82203-cf92-48f6-a96f-31ee5f5a8a8b

echo ""
echo "📝 Required variables that MUST be set:"
echo ""
echo "1. DATABASE_URL:"
echo "   Example: mysql://user:pass@host:3306/database"
echo "   ℹ️  Should be auto-set by MySQL plugin"
echo ""
echo "2. ALLOWED_ORIGINS:"
echo "   Value: https://starpath-frontend-production.up.railway.app"
echo "   ℹ️  Allows frontend CORS requests"
echo ""
echo "3. SECRET_KEY:"
echo "   Value: Generate with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
echo "   ℹ️  Used for JWT token signing"
echo ""
echo "4. ALGORITHM (optional):"
echo "   Value: HS256"
echo "   ℹ️  JWT algorithm"
echo ""

echo "🚀 To set a variable, use:"
echo "   railway variables --set VARIABLE_NAME=value"
echo ""

echo "✅ After setting all variables:"
echo "   1. Backend will auto-redeploy"
echo "   2. Check: https://starpath-production-af61.up.railway.app/api/v1/health"
echo "   3. If health endpoint works, run migrations:"
echo "   4. railway run alembic upgrade head"
echo ""
