#!/bin/bash

# Generate secrets for Railway deployment
# Run: chmod +x scripts/generate-railway-secrets.sh && ./scripts/generate-railway-secrets.sh

echo "🔐 RoyaltyOS Railway Secrets Generator"
echo "======================================"
echo ""

# Generate random strings
generate_secret() {
    node -e "console.log(require('crypto').randomBytes($1).toString('hex'))"
}

echo "Generating required secrets for Railway deployment..."
echo ""

# 32-byte (64-char hex) secrets
TOKEN_ENCRYPTION_KEY=$(generate_secret 32)
JWT_SECRET=$(generate_secret 32)
DB_PASSWORD=$(generate_secret 16)

echo "✓ Generated secrets (copy these to Railway):"
echo ""
echo "DATABASE_PASSWORD:"
echo "  $DB_PASSWORD"
echo ""
echo "TOKEN_ENCRYPTION_KEY:"
echo "  $TOKEN_ENCRYPTION_KEY"
echo ""
echo "JWT_SECRET:"
echo "  $JWT_SECRET"
echo ""
echo "=========================================="
echo "📋 Add these to Railway Dashboard:"
echo "   1. Go to railway.app/dashboard"
echo "   2. Select your project"
echo "   3. Go to Variables"
echo "   4. Add each secret above"
echo ""
echo "⚠️  Keep these values secret!"
echo "=========================================="
echo ""
echo "Also need to add (from your providers):"
echo "  - CLERK_SECRET_KEY"
echo "  - CLERK_PUBLISHABLE_KEY"
echo "  - SENDGRID_API_KEY"
echo "  - DSP provider credentials (optional)"
