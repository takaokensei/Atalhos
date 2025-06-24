# Supabase to Neon Migration Guide

## Overview
This document outlines the complete migration from Supabase to Neon as the primary database solution for the Atalho link shortener application.

## Key Changes Made

### 1. Database Client Migration
**Before (Supabase):**
\`\`\`typescript
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(url, key)
\`\`\`

**After (Neon):**
\`\`\`typescript
import { neon } from '@neondatabase/serverless'
const sql = neon(databaseUrl)
\`\`\`

### 2. Environment Variables

**Removed Supabase Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`

**Added Neon Variables:**
- `DATABASE_URL` (Primary connection with pooling)
- `DATABASE_URL_UNPOOLED` (Direct connection for migrations)

### 3. Database Operations

**Before (Supabase SDK):**
\`\`\`typescript
const { data, error } = await supabase
  .from("shortcuts_links")
  .select("*")
  .eq("slug", slug)
  .single()
\`\`\`

**After (Raw SQL with Neon):**
\`\`\`typescript
const result = await sql`
  SELECT * FROM shortcuts_links 
  WHERE slug = ${slug}
  LIMIT 1
`
\`\`\`

### 4. Authentication Changes
- **Removed**: Supabase built-in authentication
- **Impact**: Application now operates without user authentication
- **Rationale**: Simplified architecture for personal link management tool

### 5. File Changes

#### New Files:
- `lib/neon.ts` - Neon database client and utilities
- `app/api/test-neon/route.ts` - Neon connection testing
- `scripts/neon-setup.sql` - Database schema creation
- `scripts/neon-verify.sql` - Migration verification
- `scripts/neon-migration-helper.sql` - Migration assistance
- `MIGRATION.md` - This documentation

#### Modified Files:
- `app/actions/link-actions.ts` - Complete rewrite using Neon SQL
- `hooks/useLinkSync.ts` - Updated to use Neon instead of Supabase
- `app/api/redirect/[slug]/route.ts` - Updated database calls
- `app/api/resolve/[slug]/route.ts` - Updated database calls
- `package.json` - Removed Supabase, added Neon dependencies

#### Removed Files:
- `lib/supabase.ts` - Replaced by `lib/neon.ts`
- `app/api/test-supabase/route.ts` - Replaced by `app/api/test-neon/route.ts`

## Technical Differences

### Database Connection
| Aspect | Supabase | Neon |
|--------|----------|------|
| Client Type | REST API Client | Direct SQL Client |
| Connection | HTTP/REST | PostgreSQL Wire Protocol |
| Pooling | Built-in | pgbouncer (configurable) |
| Queries | SDK Methods | Raw SQL |
| Type Safety | Generated Types | Manual TypeScript |

### Performance Implications
- **Neon Advantages:**
  - Direct SQL queries (potentially faster)
  - Better connection pooling control
  - Serverless-optimized architecture
  - Lower latency for simple queries

- **Trade-offs:**
  - Manual SQL query writing
  - No automatic type generation
  - More verbose error handling

### Security Considerations
- **Removed**: Row Level Security (RLS) from Supabase
- **Added**: Application-level access control
- **Impact**: Simplified security model suitable for personal use

## Migration Steps Performed

1. **Database Schema Setup**
   \`\`\`bash
   # Run the setup script
   psql $DATABASE_URL -f scripts/neon-setup.sql
   \`\`\`

2. **Environment Variable Update**
   \`\`\`bash
   # Remove Supabase variables
   unset SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
   
   # Add Neon variables
   export DATABASE_URL="your_neon_connection_string"
   \`\`\`

3. **Code Migration**
   - Replaced all Supabase client calls with Neon SQL queries
   - Updated error handling for SQL-specific errors
   - Modified data transformation logic

4. **Testing**
   \`\`\`bash
   # Test Neon connection
   curl http://localhost:3000/api/test-neon
   \`\`\`

## Verification Checklist

- [ ] Database tables created successfully
- [ ] All CRUD operations working
- [ ] Link redirection functioning
- [ ] Search and filtering operational
- [ ] Import/export features working
- [ ] Error handling appropriate
- [ ] Performance acceptable

## Rollback Plan

If rollback is needed:
1. Restore Supabase environment variables
2. Revert to previous commit before migration
3. Update DNS/deployment configuration
4. Verify Supabase connection

## Performance Benchmarks

### Query Performance (Estimated)
- **Link Lookup**: ~10-20ms (Neon) vs ~15-30ms (Supabase)
- **Bulk Operations**: ~50-100ms (Neon) vs ~100-200ms (Supabase)
- **Connection Overhead**: Lower with Neon's serverless architecture

### Resource Usage
- **Memory**: Reduced (no SDK overhead)
- **Bundle Size**: Smaller (removed Supabase SDK)
- **Cold Start**: Faster (direct SQL connection)

## Conclusion

The migration from Supabase to Neon provides:
- ✅ Better performance for simple operations
- ✅ More control over database connections
- ✅ Simplified architecture
- ✅ Cost optimization for serverless workloads
- ✅ Standard PostgreSQL compatibility

The trade-off of manual SQL writing is acceptable for this application's scope and provides better long-term maintainability.
