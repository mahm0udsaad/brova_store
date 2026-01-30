# Refactoring Report - Phase 0 & 1

## Summary of Changes
Implemented strictly required changes to modernize the codebase structure, enforce tooling, and introduce multi-tenancy foundations.

### Task A: pnpm Enforcement
- **Enforced `pnpm`**: Updated `package.json` with `"packageManager": "pnpm@9.1.0"` and added a `preinstall` script (`npx only-allow pnpm`).
- **Cleaned Lockfiles**: Removed `bun.lock`.
- **Documentation**: Updated `README.md` to explicitly state `pnpm` usage.

### Task B: Instrumentation (Edge Safety)
- **Refactored `instrumentation.ts`**: Converted the top-level SDK initialization to a `register` function.
- **Dynamic Loading**: Created `instrumentation.node.ts` to house Node.js-specific OpenTelemetry logic.
- **Edge Guard**: `instrumentation.ts` now only imports `instrumentation.node.ts` when `process.env.NEXT_RUNTIME === 'nodejs'`, preventing Edge runtime crashes.
- **Dependencies**: Added missing `@opentelemetry/resources` and `@opentelemetry/semantic-conventions` to `package.json` to fix import errors.

### Task C: Tenant Resolver
- **Created Resolver**: `lib/tenant-resolver.ts` implements `resolveTenant()`.
    - Logic: parses `headers().get('host')` to extract subdomain as tenant slug.
    - Fallback: Defaults to `"brova"` for `localhost`, IP addresses, or non-subdomain Vercel URLs to maintain V1 behavior.
    - Override: Supports `x-tenant-override` header for testing.
- **Storefront Integration**:
    - `app/[locale]/page.tsx`: Replaced hardcoded `const orgSlug = 'brova'` with `await resolveTenant()`.
    - `app/[locale]/product/[id]/page.tsx`: Updated `ProductPage` and `generateMetadata` to use `await resolveTenant()`.
- **Root Layout & SEO**:
    - `app/layout.tsx`: Moved `jsonLd` generation inside `RootLayout`.
    - Dynamic JSON-LD: Populates `Organization` and `WebSite` schema with resolved tenant URL and name (defaults to Brova if slug is 'brova').

## File References
- `package.json`
- `README.md`
- `instrumentation.ts`
- `instrumentation.node.ts` (New)
- `lib/tenant-resolver.ts` (New)
- `app/[locale]/page.tsx`
- `app/[locale]/product/[id]/page.tsx`
- `app/layout.tsx`

## Verification & Tests
- **Tooling**: Verified `pnpm` is active.
- **Build/Types**: Ran `pnpm tsc --noEmit`.
    - **Note**: Encountered pre-existing type errors in `lib/ai/toasts.ts` (JSX in `.ts` file). This was unrelated to the changes and left as-is to preserve scope.
- **Runtime Safety**: Instrumentation changes ensure `NodeSDK` is not bundled/executed in Edge/Browser environments.

## Risks & Assumptions
- **Tenant Resolution**: The subdomain parser assumes standard `tenant.domain.com` structure. Complex custom domain mapping would require a DB lookup (deferred to future phases).
- **Hardcoded Fallbacks**: "Brova" remains the default fallback tenant to ensure the current single-tenant deployment continues to function without DB changes.
- **Existing Errors**: The codebase contains existing type errors (`lib/ai/toasts.ts`) which might fail strict CI checks.

## DB Query Log
No database changes were required for this task.
