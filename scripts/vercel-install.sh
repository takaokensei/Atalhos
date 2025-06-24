#!/bin/bash
# Vercel installation script with Corepack support

set -e

echo "🚀 Starting Vercel installation with pnpm@9.0.6..."

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

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install --reporter=append-only

echo "🎉 Installation completed successfully!"
