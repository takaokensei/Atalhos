#!/bin/bash
# Vercel installation script with Corepack support and lock file handling

set -e

echo "🚀 Starting Vercel installation with pnpm@9.0.6..."

# Remove any existing outdated lock file
echo "🧹 Cleaning up outdated lock files..."
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock

# Check if Corepack is available
if ! command -v corepack &> /dev/null; then
    echo "❌ Corepack not found. Installing..."
    npm install -g corepack
fi

# Enable Corepack
echo "🔧 Enabling Corepack..."
corepack enable

# Prepare and activate pnpm 9.0.6
echo "📦 Preparing pnpm@9.0.6..."
corepack prepare pnpm@9.0.6 --activate

# Verify pnpm version
echo "✅ Verifying pnpm version..."
pnpm --version

# Install dependencies (this will create a new lock file)
echo "📥 Installing dependencies..."
pnpm install --reporter=append-only --no-frozen-lockfile

echo "🎉 Installation completed successfully!"
