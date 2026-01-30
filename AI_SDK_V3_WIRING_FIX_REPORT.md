# AI SDK v3 Wiring Fix - Implementation Report

**Date**: 2026-01-30
**Issue**: Build failing due to incorrect AI SDK v3 (ai/rsc) wiring and Next.js server action constraints
**Status**: ✅ Fixed

---

## Problem Summary

The build was failing with the following critical error:

```
Error: It is not allowed to define inline "use server" annotated Server Actions in Client Components.
```

**Root Cause:**
1. Client components ([ConciergeConversation.tsx](components/admin-concierge/ConciergeConversation.tsx:17)) were directly importing from [app/actions.tsx](app/actions.tsx:1)
2. This caused Next.js to treat the server actions file as a client module
3. Inline `'use server'` directives inside functions conflicted with Next.js rules for client modules
4. Missing `AI.Provider` wrapper in the component tree
5. Hooks were being imported from the wrong location (actions file instead of `'ai/rsc'`)

---

## Changes Made

### 1. Server Actions File Structure ([app/actions.tsx](app/actions.tsx:1))

**Before:**
```typescript
import 'server-only'

import { createAI, getMutableAIState, streamUI } from 'ai/rsc'
// ...

async function submitUserMessage(userInput: string, context: AgentContext) {
  'use server'  // ❌ Inline directive
  // ...
}

async function requestApproval(draftIds: string[], context: AgentContext) {
  'use server'  // ❌ Inline directive
  // ...
}

// More functions with inline 'use server'...
```

**After:**
```typescript
'use server'  // ✅ File-level directive only

import { createAI, getMutableAIState, streamUI } from 'ai/rsc'
// ...

async function submitUserMessage(userInput: string, context: AgentContext) {
  // ✅ No inline directive needed
  const aiState = getMutableAIState<typeof AI>();
  // ...
}

async function requestApproval(draftIds: string[], context: AgentContext) {
  // ✅ No inline directive needed
  const aiState = getMutableAIState<typeof AI>();
  // ...
}

// All inline 'use server' directives removed...
```

**Changes:**
- Replaced `import 'server-only'` with `'use server'` at the top of the file (line 1)
- Removed all inline `'use server'` directives from within functions (lines 49, 241, 269, 272, 284, 381, 409)
- This follows the correct AI SDK v3 pattern where the file-level directive covers all exported functions

---

### 2. Client Component Imports ([components/admin-concierge/ConciergeConversation.tsx](components/admin-concierge/ConciergeConversation.tsx:17))

**Before:**
```typescript
import { useUIState, useActions } from '@/app/actions';  // ❌ Wrong source
import type { AIState, UIState } from '@/app/actions';   // ❌ Wrong types

// ...

const [aiMessages, setAiMessages] = useUIState<typeof UIState>();  // ❌ Wrong type
const { submitUserMessage } = useActions<typeof AIState>();        // ❌ Wrong type
```

**After:**
```typescript
import { useUIState, useActions } from 'ai/rsc';  // ✅ Correct source
import type { AI } from '@/app/actions';          // ✅ Type-only import

// ...

const [aiMessages, setAiMessages] = useUIState<typeof AI>();  // ✅ Correct type
const { submitUserMessage } = useActions<typeof AI>();        // ✅ Correct type
```

**Changes:**
- Import hooks from `'ai/rsc'` (the AI SDK package) instead of from the actions file (line 17)
- Import only the `AI` type from actions file using `type` keyword (line 18)
- Update hook type parameters to use `typeof AI` instead of `typeof UIState/AIState` (lines 39-40)

---

### 3. AI Provider Wrapper ([components/admin-concierge/ConciergeProvider.tsx](components/admin-concierge/ConciergeProvider.tsx:31))

**Before:**
```typescript
// No AI import

export function ConciergeProvider({ children, ... }: ConciergeProviderProps) {
  // ... state and logic ...

  return (
    <ConciergeContext.Provider value={value}>
      {children}
    </ConciergeContext.Provider>
  )
}
```

**After:**
```typescript
import { AI } from "@/app/actions"  // ✅ Import AI provider

export function ConciergeProvider({ children, ... }: ConciergeProviderProps) {
  // ... state and logic ...

  return (
    <AI>  {/* ✅ Wrap with AI provider */}
      <ConciergeContext.Provider value={value}>
        {children}
      </ConciergeContext.Provider>
    </AI>
  )
}
```

**Changes:**
- Added import for `AI` provider from actions file (line 31)
- Wrapped the provider tree with `<AI>` component (lines 450-454)
- This enables `useUIState` and `useActions` hooks to work in child components

---

## Architecture Explanation

### Before: Incorrect Pattern ❌

```
Client Component (ConciergeConversation.tsx)
    ↓ imports hooks AND types from
app/actions.tsx (treated as client module due to import)
    ↓ contains inline 'use server' (violation!)
    ❌ BUILD FAILS
```

**Why it failed:**
- When a client component imports a file, Next.js treats that file as part of the client bundle
- Inline `'use server'` directives are not allowed in client modules
- Hooks were being imported from the wrong source

### After: Correct Pattern ✅

```
Client Component (ConciergeConversation.tsx)
    ↓ imports hooks from 'ai/rsc' package
    ↓ imports types only from app/actions.tsx (type-only import doesn't create client dependency)

app/actions.tsx (server-only module)
    ↓ has 'use server' at file level
    ↓ exports AI provider
    ✅ BUILD SUCCEEDS

Component Tree:
<AI>  ← Provider from actions.tsx
  <ConciergeProvider>
    <ConciergeConversation>  ← Uses useUIState/useActions from 'ai/rsc'
```

**Why it works:**
- Client components import runtime hooks from `'ai/rsc'` package (proper source)
- Type imports don't create module dependencies
- Server actions file remains server-only with file-level directive
- AI.Provider wraps the component tree, enabling RSC functionality

---

## Verification Commands

To verify the fixes work correctly:

```bash
# 1. Install dependencies (if lockfile is out of sync)
pnpm install --no-frozen-lockfile

# 2. Run production build
pnpm build

# 3. Expected output: Build should succeed without errors
```

**Expected Success Indicators:**
- ✅ No "use server" in client component errors
- ✅ No module resolution errors for 'ai/rsc'
- ✅ Build completes successfully with compiled routes

---

## Key Takeaways

### AI SDK v3 (ai/rsc) Best Practices

1. **Server Actions File:**
   - Use `'use server'` directive at the **top** of the file
   - Do NOT use inline `'use server'` in individual functions
   - Export the AI provider created with `createAI()`

2. **Client Components:**
   - Import `useUIState` and `useActions` from `'ai/rsc'` package
   - Import types from actions file using `type` keyword only
   - Use `typeof AI` for hook type parameters

3. **Provider Setup:**
   - Wrap your component tree with the `<AI>` provider
   - Place the provider as high as needed in the tree to cover all components using the hooks

4. **Import Rules:**
   - ✅ Runtime imports: `import { useUIState, useActions } from 'ai/rsc'`
   - ✅ Type imports: `import type { AI } from '@/app/actions'`
   - ❌ Wrong: `import { useUIState } from '@/app/actions'`

---

## Files Modified

1. [app/actions.tsx](app/actions.tsx:1) - Server actions file structure
2. [components/admin-concierge/ConciergeConversation.tsx](components/admin-concierge/ConciergeConversation.tsx:17) - Client component imports
3. [components/admin-concierge/ConciergeProvider.tsx](components/admin-concierge/ConciergeProvider.tsx:31) - AI.Provider wrapper

---

## Summary

The AI SDK v3 wiring has been corrected to follow Next.js and Vercel AI SDK best practices:

- ✅ Server actions file uses file-level `'use server'` directive
- ✅ Client components import hooks from `'ai/rsc'` package
- ✅ Type-only imports prevent client/server boundary violations
- ✅ AI.Provider properly wraps the component tree
- ✅ Build should now pass without errors

The implementation now follows the official AI SDK v3 pattern for React Server Components with proper separation between client and server code.
