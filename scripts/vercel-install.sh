#!/bin/bash

set -e

echo "🚀 Starting Vercel installation process..."

# Check if we're in a CI environment
if [ "$VERCEL" = "1" ] || [ "$CI" = "true" ]; then
  echo "📦 Running in CI/Vercel environment"
else
  echo "🏠 Running in local environment"
fi

# Remove any existing lock files to prevent conflicts
echo "🧹 Cleaning up existing lock files..."
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock

# Check if corepack is available
if command -v corepack >/dev/null 2>&1; then
  echo "✅ Corepack is available"
  
  # Enable corepack
  echo "🔧 Enabling corepack..."
  corepack enable
  
  # Prepare pnpm 9.0.6
  echo "📦 Preparing pnpm@9.0.6..."
  corepack prepare pnpm@9.0.6 --activate
  
  # Verify pnpm version
  echo "🔍 Verifying pnpm version..."
  pnpm --version
  
  # Install dependencies
  echo "📥 Installing dependencies with pnpm..."
  pnpm install --no-frozen-lockfile --prefer-offline
  
else
  echo "❌ Corepack not available, falling back to npm..."
  
  # Use npm as fallback
  npm install --legacy-peer-deps --no-audit
fi

echo "✅ Installation completed successfully!"

# Verify critical dependencies
echo "🔍 Verifying critical dependencies..."
if [ -d "node_modules/next" ]; then
  echo "✅ Next.js installed"
else
  echo "❌ Next.js missing"
  exit 1
fi

if [ -d "node_modules/cssnano" ]; then
  echo "✅ cssnano installed"
else
  echo "❌ cssnano missing"
  exit 1
fi

echo "🎉 All dependencies verified!"
