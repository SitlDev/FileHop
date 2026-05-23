#!/bin/bash

# FileHop Production Deployment Setup Script
# This script prepares the application for production deployment

set -e

echo "🚀 FileHop Production Deployment Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}✗ $1 is not installed${NC}"
    return 1
  else
    echo -e "${GREEN}✓ $1 is installed${NC}"
    return 0
  fi
}

check_command "node" || exit 1
check_command "npm" || exit 1
check_command "git" || exit 1

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo "  Node.js: $NODE_VERSION"
echo "  npm: $NPM_VERSION"

# Verify Node.js version (18+)
NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ is required${NC}"
  exit 1
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"

echo "  Installing backend dependencies..."
cd backend
npm ci --omit=dev
cd ..

echo "  Installing frontend dependencies..."
cd frontend
npm ci --omit=dev
cd ..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build applications
echo -e "\n${YELLOW}Building applications...${NC}"

echo "  Building backend..."
cd backend
npm run build
cd ..

echo "  Building frontend..."
cd frontend
npm run build
cd ..

echo -e "${GREEN}✓ Build successful${NC}"

# Generate secrets
echo -e "\n${YELLOW}Generating secrets...${NC}"

JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "GENERATE_MANUALLY")
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "GENERATE_MANUALLY")

echo "  JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:20}..."

# Create environment template
echo -e "\n${YELLOW}Creating environment files...${NC}"

if [ ! -f backend/.env ]; then
  cp backend/.env.production backend/.env
  echo -e "${GREEN}✓ Created backend/.env${NC}"
  
  # Insert generated secrets
  sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
  sed -i.bak "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" backend/.env
  rm -f backend/.env.bak
else
  echo -e "${YELLOW}⚠ backend/.env already exists, skipping...${NC}"
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.production frontend/.env.local
  echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
else
  echo -e "${YELLOW}⚠ frontend/.env.local already exists, skipping...${NC}"
fi

# Verify builds
echo -e "\n${YELLOW}Verifying builds...${NC}"

if [ -d "backend/dist" ]; then
  echo -e "${GREEN}✓ Backend built successfully${NC}"
else
  echo -e "${RED}✗ Backend build failed${NC}"
  exit 1
fi

if [ -d "frontend/.next" ]; then
  echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
  echo -e "${RED}✗ Frontend build failed${NC}"
  exit 1
fi

# Database setup
echo -e "\n${YELLOW}Database setup...${NC}"

echo "  To run migrations, execute:"
echo "  cd backend && npm run db:migrate"

# Final checklist
echo -e "\n${GREEN}✓ Deployment preparation complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review and update environment variables in:"
echo "   - backend/.env (required: AWS, Stripe, Resend credentials)"
echo "   - frontend/.env.local (required: API_URL, Stripe key)"
echo ""
echo "2. Set up database:"
echo "   cd backend && npm run db:migrate"
echo ""
echo "3. Run in production:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. Or deploy to cloud:"
echo "   - Vercel (frontend)"
echo "   - Railway/Render (backend)"
echo ""
echo "5. Configure Stripe webhook endpoint:"
echo "   https://yourdomain.com/api/webhooks/stripe"
echo ""
echo "See DEPLOYMENT.md for detailed instructions"
echo ""
