#!/bin/bash
# Cleanup script for frontend - removes unnecessary files

echo "🧹 Cleaning up frontend directory..."

cd "$(dirname "$0")"

# Remove Supabase folder (not using it)
echo "Removing Supabase folder..."
rm -rf supabase/

# Remove alternative lock files
echo "Removing alternative lock files..."
rm -f bun.lockb
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Remove documentation that should be in root
echo "Removing local documentation..."
rm -f DATE_RANGE_PICKER.md

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf dist/
rm -rf build/
rm -rf .cache/

echo "✅ Frontend cleanup complete!"
echo ""
echo "Kept files:"
echo "  ✅ src/ - Application code"
echo "  ✅ public/ - Static assets"
echo "  ✅ package.json - Dependencies"
echo "  ✅ package-lock.json - Lock file"
echo "  ✅ .github/workflows/ - CI/CD for S3 deployment"
echo "  ✅ vite.config.ts - Build config"
echo ""
echo "Deployment: npm run build → S3 + CloudFront"
echo "Run 'npm install' if node_modules was removed"
