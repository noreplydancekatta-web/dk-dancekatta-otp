#!/bin/bash

echo "🚀 Deploying DanceKatta API to OnRender..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the dancekatta_api directory."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed. Please install Git first."
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Please commit them first:"
    git status --porcelain
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if we're on the main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
    echo "⚠️  Warning: You're not on the main branch (current: $current_branch)"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Checking dependencies..."
npm install

echo "🔍 Checking for missing endpoints..."
echo "Testing /api/branches endpoint..."
curl -s -o /dev/null -w "%{http_code}" https://dancekatta-otp-test.onrender.com/api/branches

echo ""
echo "Testing /api/filters/days endpoint..."
curl -s -o /dev/null -w "%{http_code}" https://dancekatta-otp-test.onrender.com/api/filters/days

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Push your changes to your Git repository:"
echo "   git add ."
echo "   git commit -m 'Fix missing endpoints and improve error handling'"
echo "   git push origin main"
echo ""
echo "2. OnRender should automatically redeploy your service"
echo ""
echo "3. Wait a few minutes for the deployment to complete"
echo ""
echo "4. Test the endpoints again:"
echo "   curl https://dancekatta-otp-test.onrender.com/api/branches"
echo "   curl https://dancekatta-otp-test.onrender.com/api/filters/days"
echo ""
echo "🔧 If the endpoints are still not working, check your OnRender dashboard for deployment logs." 