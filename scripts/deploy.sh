#!/usr/bin/env bash

# Torre v2 - Deployment Script
# Automated deployment with safety checks

set -e  # Exit on error

echo "🚀 Torre v2 Deployment Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SKIP_TESTS=${SKIP_TESTS:-false}

echo "📋 Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Skip Tests: $SKIP_TESTS"
echo ""

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check environment variables
echo "🔍 Step 1: Checking environment variables..."

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    print_error "FIREBASE_PROJECT_ID not set"
    exit 1
fi

print_success "Environment variables OK"
echo ""

# Step 2: Run tests (unless skipped)
if [ "$SKIP_TESTS" = "false" ]; then
    echo "🧪 Step 2: Running tests..."
    
    # Unit tests
    npm test || {
        print_error "Unit tests failed"
        exit 1
    }
    
    print_success "Tests passed"
else
    print_warning "Skipping tests (SKIP_TESTS=true)"
fi
echo ""

# Step 3: Build
echo "🏗️  Step 3: Building application..."

npm run build || {
    print_error "Build failed"
    exit 1
}

print_success "Build successful"
echo ""

# Step 4: Deploy to Vercel
echo "🚢 Step 4: Deploying to Vercel..."

if [ "$ENVIRONMENT" = "staging" ]; then
    vercel --env=staging || {
        print_error "Deployment to staging failed"
        exit 1
    }
    print_success "Deployed to staging"
elif [ "$ENVIRONMENT" = "production" ]; then
    # Confirmation prompt
    echo ""
    print_warning "You are about to deploy to PRODUCTION"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_error "Deployment cancelled"
        exit 1
    fi
    
    vercel --prod || {
        print_error "Deployment to production failed"
        exit 1
    }
    print_success "Deployed to production"
else
    print_error "Invalid environment: $ENVIRONMENT (must be 'staging' or 'production')"
    exit 1
fi
echo ""

# Step 5: Health check
echo "🏥 Step 5: Running health check..."

sleep 5  # Wait for deployment to stabilize

if [ "$ENVIRONMENT" = "staging" ]; then
    HEALTH_URL="https://your-staging-url.vercel.app/api/health/integrations"
else
    HEALTH_URL="https://your-domain.com/api/health/integrations"
fi

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HEALTH_STATUS" = "200" ]; then
    print_success "Health check passed (200 OK)"
else
    print_error "Health check failed (HTTP $HEALTH_STATUS)"
    print_warning "Consider rolling back!"
    exit 1
fi
echo ""

# Step 6: Summary
echo "=============================="
echo "🎉 Deployment Complete!"
echo "=============================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Status: Success"
echo "Health: OK"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔍 Monitor the following:"
    echo "  - Vercel Dashboard: https://vercel.com/dashboard"
    echo "  - Health Endpoint: $HEALTH_URL"
    echo "  - Error Tracking: Check logs"
    echo ""
    echo "⚠️  Remember: You can rollback with 'vercel rollback'"
fi

echo ""
print_success "All done! 🚀"
