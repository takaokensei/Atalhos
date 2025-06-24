#!/bin/bash
# Setup script for pnpm 9.0.6

echo "Setting up pnpm 9.0.6..."

# Enable corepack
corepack enable

# Prepare and activate pnpm 9.0.6
corepack prepare pnpm@9.0.6 --activate

# Verify pnpm version
echo "pnpm version: $(pnpm --version)"

# Remove outdated lock file if it exists
if [ -f "pnpm-lock.yaml" ]; then
    echo "Removing outdated pnpm-lock.yaml..."
    rm pnpm-lock.yaml
fi

# Install dependencies and generate new lock file
echo "Installing dependencies..."
pnpm install

echo "pnpm setup complete!"
