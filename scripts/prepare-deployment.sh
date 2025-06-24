#!/bin/bash
# Prepare deployment by cleaning up outdated files

echo "Preparing for deployment..."

# Remove outdated lock files
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock

# Remove node_modules if it exists
rm -rf node_modules

# Remove .next build cache
rm -rf .next

echo "Cleanup complete. Ready for fresh deployment."
