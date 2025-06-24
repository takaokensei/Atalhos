#!/bin/bash
# Setup script for pnpm 9.0.6

echo "Setting up pnpm 9.0.6..."

# Enable corepack
corepack enable

# Prepare and activate pnpm 9.0.6
corepack prepare pnpm@9.0.6 --activate

# Verify pnpm version
pnpm --version

# Install dependencies
pnpm install --frozen-lockfile

echo "pnpm setup complete!"
