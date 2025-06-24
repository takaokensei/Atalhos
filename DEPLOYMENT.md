# Deployment Guide

## Vercel Deployment with pnpm@9.0.6

### Required Environment Variables

You **MUST** set the following environment variable in your Vercel project settings:

\`\`\`bash
ENABLE_EXPERIMENTAL_COREPACK=1
\`\`\`

### How to Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Production, Preview, Development |
| `DATABASE_URL` | `your-neon-connection-string` | Production, Preview, Development |
| `GEMINI_API_KEY` | `your-gemini-api-key` | Production, Preview, Development |

### Deployment Process

1. **Enable Corepack**: The `ENABLE_EXPERIMENTAL_COREPACK=1` environment variable enables Corepack in Vercel
2. **Activate pnpm**: Corepack prepares and activates pnpm@9.0.6 as specified in `packageManager`
3. **Install Dependencies**: pnpm installs all dependencies with the correct version
4. **Build**: Next.js builds the application

### Troubleshooting

#### If Corepack fails:
1. Verify `ENABLE_EXPERIMENTAL_COREPACK=1` is set in Vercel
2. Check that `packageManager: "pnpm@9.0.6"` is in package.json
3. Try redeploying after clearing build cache

#### Fallback to npm:
If pnpm continues to fail, you can temporarily use the fallback configuration:
\`\`\`bash
cp vercel-fallback.json vercel.json
\`\`\`

### Local Development

For local development, run:
\`\`\`bash
# Setup pnpm 9.0.6
bash scripts/setup-pnpm.sh

# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

### Verification

After deployment, verify:
- [ ] Application loads correctly
- [ ] Database connection works (`/api/test-neon`)
- [ ] AI suggestions work
- [ ] Link creation and redirection work
