# Security Patterns Guide

This document summarizes security patterns to follow to avoid SonarCloud security issues.

## 1. Cryptographically Secure Random Values

### ❌ Non-Compliant (Sensitive)
```typescript
// Math.random() is NOT cryptographically secure
const id = Math.random().toString(36).substring(7);
const filePath = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
```

### ✅ Compliant Solution
```typescript
// Client-side: Use Web Crypto API
const randomBytes = new Uint8Array(8);
crypto.getRandomValues(randomBytes);
const randomStr = Array.from(randomBytes)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// For file paths
const filePath = `uploads/${Date.now()}-${randomStr}.png`;

// For IDs
const id = randomStr;
```

### When to Use
- File path generation
- Unique identifiers in security contexts
- Token generation
- Any random value that could be predicted to cause security issues

---

## 2. Regular Expression Denial of Service (ReDoS) Prevention

### ❌ Non-Compliant Patterns

```typescript
// Unbounded repetitions with backtracking potential
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // Vulnerable

// Greedy quantifiers with overlapping patterns
const commentRegex = /#comment\s+(.+?)(?=#|$)/gi;  // Vulnerable

// Nested quantifiers
const badRegex = /(a+)+$/;  // Catastrophic backtracking
```

### ✅ Compliant Solutions

```typescript
// Use bounded quantifiers with explicit limits
const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;

// Use negated character classes instead of lazy quantifiers
const commentRegex = /#comment\s+([^#\n]{1,500})/gi;

// Avoid nested quantifiers or use atomic groups (via lookahead)
const safeRegex = /((?=(a+))\2)+$/;
```

### Key Principles
1. **Bounded quantifiers**: Use `{1,N}` instead of `+` or `*`
2. **Negated character classes**: Use `[^X]+` instead of `.+?` when possible
3. **Avoid nested quantifiers**: `(a+)+` is dangerous
4. **Input length limits**: Validate input length before regex matching
5. **Timeout mechanisms**: For user-provided patterns, implement timeouts

### Common Patterns Reference

| Pattern Type | Vulnerable | Safe Alternative |
|-------------|-----------|------------------|
| Email | `[^\s@]+@[^\s@]+\.[^\s@]+` | `[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}` |
| Comment extraction | `.+?(?=#\|$)` | `[^#\n]{1,500}` |
| Whitespace split | `\s*,\s*` | Split first, then trim |
| URL path | `.*\/.*` | `[^\/]*\/[^\/]*` |

---

## 3. Accessibility with Click Handlers

### ❌ Non-Compliant
```tsx
// Interactive div without keyboard support
<div onClick={handleClick}>Click me</div>
```

### ✅ Compliant Solution
```tsx
// Add keyboard handler and ARIA attributes
<div 
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
  role="button"
  tabIndex={0}
  aria-label="Descriptive label"
>
  Click me
</div>

// Or better: use semantic elements
<button onClick={handleClick}>Click me</button>
```

---

## 4. JWT and Secrets Handling

### ❌ Non-Compliant
```typescript
// Hardcoded secrets in code
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const apiKey = "sk-secret-key-12345";
```

### ✅ Compliant Solution
```typescript
// Use environment variables
const token = process.env.API_TOKEN;
const apiKey = Deno.env.get("API_KEY");

// For Supabase anon keys (public by design)
// These are intentionally public and safe in client code
// Mark as false positive in SonarCloud if flagged
```

### Note on Supabase Anon Keys
The `VITE_SUPABASE_PUBLISHABLE_KEY` is a **public anon key** designed to be exposed in client-side code. Security is enforced via Row Level Security (RLS) policies, not key secrecy. This is a **false positive** in SonarCloud.

---

## 5. Input Validation

### ❌ Non-Compliant
```typescript
// No validation before use
const userInput = request.body.email;
sendEmail(userInput);
```

### ✅ Compliant Solution
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string()
    .trim()
    .email()
    .max(255)
});

const validated = schema.parse(request.body);
sendEmail(validated.email);
```

---

## 6. Test Files and Mocks

### Test Setup Pattern
```typescript
// In test setup files, deterministic mocks are acceptable
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      // Deterministic for reproducible tests
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i * 17 + 42) % 256;
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-1234-5678-9abc-def012345678',
    subtle: {} as SubtleCrypto
  }
});
```

---

## Quick Reference Checklist

Before committing code, verify:

- [ ] No `Math.random()` in security-sensitive contexts
- [ ] All regex patterns have bounded quantifiers
- [ ] No nested quantifiers in regex
- [ ] All clickable divs have `onKeyDown`, `role`, and `tabIndex`
- [ ] No hardcoded secrets (except Supabase anon keys)
- [ ] All user inputs validated with Zod
- [ ] Email regex uses `{1,64}@{1,253}\.{2,63}` bounds
- [ ] Comment/text extraction regex uses negated character classes

---

## SonarCloud False Positives

Mark these as false positives:
1. `VITE_SUPABASE_PUBLISHABLE_KEY` - This is a public anon key by design
2. `VITE_SUPABASE_URL` - This is a public endpoint by design
3. Crypto mocks in test files - These are intentionally deterministic for testing
