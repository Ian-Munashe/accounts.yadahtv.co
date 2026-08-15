# SSO Join and Logout Return Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After SSO arrival, creating an account or logging out resumes the origin-app SSO loop instead of dumping the user on the Account Center dashboard or a bare `/signin`.

**Architecture:** Keep `returnTo` on `/signin` and `/join` query strings. Persist the same value as `ssoReturnTo` on the iron-session cookie so protected pages still know the origin. Shared path helpers in `src/lib/sso-return.ts` build join/signin links and `/sso/authorize?redirect=...` resume URLs. Ticket issuance in `/sso/authorize` is unchanged.

**Tech Stack:** Next.js 16 App Router, iron-session, Bun (`bun test` for helpers), existing HeroUI/Formik auth pages.

**Spec:** `docs/superpowers/specs/2026-08-15-sso-join-and-logout-return-design.md`

## Global Constraints

- Bun only — never npm / yarn / pnpm
- Port 3001
- Do not invent backend API endpoints
- Do not weaken auth — keep iron-session, `proxy.ts` guards, token refresh, and `/sso/authorize` ticket flow intact
- Do not treat `ssoReturnTo` alone as authentication (still require accessToken + refreshToken + user)
- Query param name stays `returnTo` (do not invent a second name)
- No sessionStorage / extra cookies for the return URL
- After logout with SSO context, go through `/sso/authorize` (not the origin URL without a ticket)
- Direct Account Center login/join/logout (no `returnTo` / no `ssoReturnTo`) stays `/` after auth and `/signin` after logout
- Path alias `@/*` → `./src/*`
- Double quotes, Prettier width 120
- Do not add `useMemo` / `useCallback` by default
- Do not add Jest, Vitest, or Testing Library — use Bun’s built-in test runner for helpers
- Do not commit unless the user explicitly asked to commit in this session (skip commit steps if not asked)
- Never commit or paste secrets from `.env` / `.env.local`

---

### Task 1: SSO path helpers

**Files:**
- Create: `src/lib/sso-return.ts`
- Create: `src/lib/sso-return.test.ts`
- Modify: `package.json` (add `"test": "bun test"` script only)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `authPathWithReturnTo(path: "/signin" | "/join", returnTo?: string | null): string`
  - `ssoResumePath(returnTo: string): string`
  - `ssoResumeTarget(returnToFromQuery?: string | null, ssoReturnToFromSession?: string | null): string | undefined`
  - `destinationAfterAuth(returnTo?: string | null): string`
  - `destinationAfterLogout(returnTo?: string | null): string`
  - `resumeAfterAuth(returnTo?: string | null): void`
  - `resumeAfterLogout(returnTo?: string | null): void`

- [ ] **Step 1: Add the test script**

In `package.json` `scripts`, add `"test": "bun test"` next to `lint`. Do not change other scripts.

- [ ] **Step 2: Write the failing tests**

Create `src/lib/sso-return.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import {
  authPathWithReturnTo,
  destinationAfterAuth,
  destinationAfterLogout,
  ssoResumePath,
  ssoResumeTarget,
} from "./sso-return";

const returnTo = "/sso/authorize?redirect=https://app.example/cb&deviceId=d1&clientId=c1";

describe("authPathWithReturnTo", () => {
  test("returns the path unchanged when returnTo is missing", () => {
    expect(authPathWithReturnTo("/join")).toBe("/join");
    expect(authPathWithReturnTo("/signin", null)).toBe("/signin");
  });

  test("appends encoded returnTo", () => {
    expect(authPathWithReturnTo("/join", returnTo)).toBe(`/join?returnTo=${encodeURIComponent(returnTo)}`);
  });
});

describe("ssoResumePath", () => {
  test("matches the existing sign-in resume URL shape", () => {
    expect(ssoResumePath(returnTo)).toBe(`/sso/authorize?redirect=${encodeURIComponent(returnTo)}`);
  });
});

describe("ssoResumeTarget", () => {
  test("prefers the query value over the session value", () => {
    expect(ssoResumeTarget(returnTo, "/sso/authorize?redirect=other")).toBe(returnTo);
  });

  test("falls back to the session value", () => {
    expect(ssoResumeTarget(null, returnTo)).toBe(returnTo);
  });

  test("returns undefined when neither is set", () => {
    expect(ssoResumeTarget(null, undefined)).toBeUndefined();
  });
});

describe("destinationAfterAuth", () => {
  test("resumes SSO when returnTo is set", () => {
    expect(destinationAfterAuth(returnTo)).toBe(ssoResumePath(returnTo));
  });

  test("goes to the dashboard when returnTo is missing", () => {
    expect(destinationAfterAuth(null)).toBe("/");
  });
});

describe("destinationAfterLogout", () => {
  test("resumes SSO when returnTo is set", () => {
    expect(destinationAfterLogout(returnTo)).toBe(ssoResumePath(returnTo));
  });

  test("goes to sign-in when returnTo is missing", () => {
    expect(destinationAfterLogout(undefined)).toBe("/signin");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test src/lib/sso-return.test.ts`

Expected: FAIL because `./sso-return` does not exist (or named exports are missing).

- [ ] **Step 4: Write the helpers**

Create `src/lib/sso-return.ts`:

```ts
export const authPathWithReturnTo = (path: "/signin" | "/join", returnTo?: string | null): string => {
  if (!returnTo) return path;
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("returnTo", returnTo);
  return `${url.pathname}?${url.searchParams.toString()}`;
};

export const ssoResumePath = (returnTo: string): string => `/sso/authorize?redirect=${encodeURIComponent(returnTo)}`;

export const ssoResumeTarget = (
  returnToFromQuery?: string | null,
  ssoReturnToFromSession?: string | null,
): string | undefined => returnToFromQuery || ssoReturnToFromSession || undefined;

export const destinationAfterAuth = (returnTo?: string | null): string => (returnTo ? ssoResumePath(returnTo) : "/");

export const destinationAfterLogout = (returnTo?: string | null): string =>
  returnTo ? ssoResumePath(returnTo) : "/signin";

export const resumeAfterAuth = (returnTo?: string | null): void => {
  window.location.href = destinationAfterAuth(returnTo);
};

export const resumeAfterLogout = (returnTo?: string | null): void => {
  window.location.href = destinationAfterLogout(returnTo);
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/lib/sso-return.test.ts`

Expected: PASS, all tests in that file.

- [ ] **Step 6: Commit (only if the user asked to commit)**

```bash
git add src/lib/sso-return.ts src/lib/sso-return.test.ts package.json
git commit -m "feat: add SSO returnTo path helpers"
```

---

### Task 2: Persist `ssoReturnTo` on the session

**Files:**
- Modify: `src/types/i-session.ts`
- Modify: `src/actions/session-action.ts`
- Modify: `src/app/(authentication)/sso/authorize/route.ts`

**Interfaces:**
- Consumes: `ISession` ambient type
- Produces: `ISession.ssoReturnTo?: string`; `updateSession` writes `ssoReturnTo` when the caller passes a non-empty string and does not clear it when omitted

- [ ] **Step 1: Extend the session type**

Replace `src/types/i-session.ts` with:

```ts
interface ISession {
  user?: IUser;
  accessToken?: string;
  refreshToken?: string;
  ssoReturnTo?: string;
}
```

- [ ] **Step 2: Persist `ssoReturnTo` in `updateSession`**

In `src/actions/session-action.ts`, change `updateSession` so it destructures `ssoReturnTo` and assigns it only when provided. Keep token/user assignment unchanged. Full function:

```ts
export const updateSession = async ({ accessToken, refreshToken, user, ssoReturnTo }: ISession): Promise<ISession> => {
  const cookieStore = await cookies();
  const session: IronSession<ISession> = await getIronSession<ISession>(cookieStore, sessionOptions);

  if (user) session.user = user;
  if (accessToken) session.accessToken = accessToken;
  if (refreshToken) session.refreshToken = refreshToken;
  if (ssoReturnTo) session.ssoReturnTo = ssoReturnTo;

  await session.save();
  return JSON.parse(JSON.stringify(session));
};
```

Do not change `getSession` or `deleteSession`. `deleteSession` already destroys the cookie, which clears `ssoReturnTo`.

- [ ] **Step 3: Write `ssoReturnTo` when SSO authorize sends the user to sign-in**

In `src/app/(authentication)/sso/authorize/route.ts`, make `redirectToSignin` async and persist the authorize path+search before redirecting. Keep the `returnTo` query exactly as today (`request.nextUrl.pathname + request.nextUrl.search`).

Replace the helper with:

```ts
const redirectToSignin = async (request: NextRequest) => {
  await updateSession({ ssoReturnTo: request.nextUrl.pathname + request.nextUrl.search });
  const loginUrl = createAppUrl(request, "/signin");
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
};
```

Existing `return redirectToSignin(request)` call sites stay as-is (they already return the promise). Do not change ticket POST, refresh, or nested `redirect` / `deviceId` / `clientId` unwrapping.

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Commit (only if the user asked to commit)**

```bash
git add src/types/i-session.ts src/actions/session-action.ts src/app/(authentication)/sso/authorize/route.ts
git commit -m "feat: persist SSO returnTo on the session cookie"
```

---

### Task 3: Carry `returnTo` through join and resume after signup

**Files:**
- Modify: `src/app/(authentication)/signin/page.tsx`
- Modify: `src/app/(authentication)/join/page.tsx`
- Modify: `src/components/forms/account-registration-form.tsx`

**Interfaces:**
- Consumes: `authPathWithReturnTo`, `resumeAfterAuth`, `ssoResumeTarget` from `@/lib/sso-return`; `updateSession`; `getSession`
- Produces: Create Account / Sign In / Use a different contact keep `returnTo`; registration success calls `resumeAfterAuth` with query value or `session.ssoReturnTo`

- [ ] **Step 1: Persist query `returnTo` and keep it on Create Account (sign-in page)**

In `src/app/(authentication)/signin/page.tsx`:

1. Change the React import to `import { useEffect, useState } from "react";`
2. Add: `import { authPathWithReturnTo, resumeAfterAuth } from "@/lib/sso-return";`
3. After `const searchParams = useSearchParams();` add:

```ts
const returnTo = searchParams.get("returnTo");

useEffect(() => {
  if (returnTo) updateSession({ ssoReturnTo: returnTo });
}, [returnTo]);
```

4. Replace the Create Account href `/join` with `authPathWithReturnTo("/join", returnTo)`.
5. Replace the success redirect block inside `createSession`:

```ts
if (isSuccess) resumeAfterAuth(returnTo);
```

Do not change OTP / request-code flow.

- [ ] **Step 2: Read `returnTo` on join and pass it through**

In `src/app/(authentication)/join/page.tsx`:

1. Change the React import to `import { useEffect, useState } from "react";`
2. Add `import { useSearchParams } from "next/navigation";`
3. Add `import { updateSession } from "@/actions/session-action";`
4. Add `import { authPathWithReturnTo } from "@/lib/sso-return";`
5. Inside the page component, after `const action = "sign-up";`:

```ts
const searchParams = useSearchParams();
const returnTo = searchParams.get("returnTo");

useEffect(() => {
  if (returnTo) updateSession({ ssoReturnTo: returnTo });
}, [returnTo]);
```

6. Replace Sign In `href="/signin"` with `href={authPathWithReturnTo("/signin", returnTo)}`.
7. Pass `returnTo` into the form:

```tsx
<AccountRegistrationForm token={token} returnTo={returnTo} />
```

- [ ] **Step 3: Resume SSO after registration**

In `src/components/forms/account-registration-form.tsx`:

1. Add `import { getSession, updateSession } from "@/actions/session-action";` — keep the existing `updateSession` import if already present; merge to one import from `@/actions/session-action`.
2. Add `import { authPathWithReturnTo, resumeAfterAuth, ssoResumeTarget } from "@/lib/sso-return";`
3. Change props to:

```ts
interface Props {
  token: string;
  returnTo?: string | null;
}
```

4. After successful `getUser()`, resume with query-or-session (do not keep `window.location.href = "/"`):

```ts
const isSuccess = await getUser();
if (isSuccess) {
  const session = await getSession();
  resumeAfterAuth(ssoResumeTarget(props.returnTo, session.ssoReturnTo));
}
```

Leave `finish-signup`, `create-session`, and `updateSession({ accessToken, refreshToken })` as they are.

5. Replace Use a different contact `href="/join"` with:

```tsx
<Link href={authPathWithReturnTo("/join", props.returnTo)} className="text-muted font-medium">
```

- [ ] **Step 4: Typecheck**

Run: `bunx tsc --noEmit`

Expected: no errors.

- [ ] **Step 5: Re-run helper tests**

Run: `bun test src/lib/sso-return.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit (only if the user asked to commit)**

```bash
git add src/app/(authentication)/signin/page.tsx src/app/(authentication)/join/page.tsx src/components/forms/account-registration-form.tsx
git commit -m "feat: resume SSO after account creation"
```

---

### Task 4: Resume SSO after logout

**Files:**
- Modify: `src/hooks/authentication-hook.ts`

**Interfaces:**
- Consumes: `getSession`, `deleteSession`, `resumeAfterLogout` from `@/lib/sso-return`
- Produces: logout captures `session.ssoReturnTo` before destroying the cookie, then `resumeAfterLogout`; API failure still toasts and does not redirect

- [ ] **Step 1: Capture `ssoReturnTo` then resume after sign-out**

In `src/hooks/authentication-hook.ts`:

1. Add `getSession` to the existing session-action import (keep `deleteSession` and `updateSession`).
2. Add `import { resumeAfterLogout } from "@/lib/sso-return";`
3. Replace the `onConfirm` body so it reads the session **before** `deleteSession`. On API success, destroy the session then resume. On failure, toast and do not redirect. Keep `setIsProgress` true/false as today:

```ts
onConfirm: async () => {
  setIsProgress(true);
  try {
    const session = await getSession();
    const ssoReturnTo = session.ssoReturnTo;
    await interceptor.get("/user/signout");
    await deleteSession();
    resumeAfterLogout(ssoReturnTo);
  } catch (error: any) {
    toast.danger(error.response?.data?.message || error.message);
  } finally {
    setIsProgress(false);
  }
},
```

Do not change `getUser`. Do not add a second logout UI.

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit (only if the user asked to commit)**

```bash
git add src/hooks/authentication-hook.ts
git commit -m "feat: resume SSO after logout when the session started from an external app"
```

---

### Task 5: Proxy — authenticated guest routes resume SSO

**Files:**
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes: `ssoResumePath`, `ssoResumeTarget` from `@/lib/sso-return`; `createAppUrl`; `getSession`
- Produces: authenticated visitor on `/signin` or `/join` with query `returnTo` or `session.ssoReturnTo` is redirected to `ssoResumePath(...)`, not `/`

- [ ] **Step 1: Resume SSO instead of dumping authenticated guests on `/`**

In `src/proxy.ts`:

1. Add `import { ssoResumePath, ssoResumeTarget } from "@/lib/sso-return";`
2. Replace the guest-route authenticated redirect. `session` is already loaded. Keep unauthenticated guest as `NextResponse.next()`. Keep protected-route logic unchanged.

```ts
if (isGuestRoute) {
  if (isAuthenticated) {
    const resumeTo = ssoResumeTarget(request.nextUrl.searchParams.get("returnTo"), session.ssoReturnTo);
    if (resumeTo) return NextResponse.redirect(createAppUrl(request, ssoResumePath(resumeTo)));
    return NextResponse.redirect(createAppUrl(request, "/"));
  }
  return NextResponse.next();
}
```

Do not add `/sso/authorize` to `guestRoutes`. Do not change role gates.

- [ ] **Step 2: Typecheck**

Run: `bunx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit (only if the user asked to commit)**

```bash
git add src/proxy.ts
git commit -m "fix: send authenticated SSO guests back through authorize"
```

---

### Task 6: Update AGENTS.md playbook

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: behavior from Tasks 1–5
- Produces: session shape and SSO notes match the new join/logout resume rules

- [ ] **Step 1: Document session field and SSO resume**

In `AGENTS.md`:

1. Change the session-shape bullet to:

```text
- Session shape (`ISession`): optional `user`, `accessToken`, `refreshToken`, `ssoReturnTo`.
```

2. In **Routing & access control**, change the Guest row from “Redirect to `/` if already authenticated” to:

```text
| Guest | `/signin`, `/join` | If already authenticated: resume SSO when `returnTo` or session `ssoReturnTo` is set, otherwise `/` |
```

3. Extend the SSO bullet so it includes join and logout. Replace the existing SSO bullet with:

```text
- **SSO**: `GET /sso/authorize` issues a backend ticket and redirects to the client app with `?ticket=...`. Requires `redirect`, `deviceId`, `clientId`. On 401, refresh tokens then retry; otherwise send user to `/signin` with `returnTo` and persist `ssoReturnTo` on the session. Sign-in and join must keep `returnTo` on Create Account / Sign In / Use a different contact links (`src/lib/sso-return.ts`). After sign-in or account creation, call `resumeAfterAuth`. After logout, call `resumeAfterLogout` using `ssoReturnTo` captured before `deleteSession`.
```

Do not rewrite unrelated sections.

- [ ] **Step 2: Commit (only if the user asked to commit)**

```bash
git add AGENTS.md
git commit -m "docs: record SSO returnTo for join and logout"
```

---

## Manual verification (after all tasks)

Use an origin-app URL that already works for sign-in SSO (`/sso/authorize?redirect=...&deviceId=...&clientId=...`).

1. **SSO → Create Account:** land on `/signin?returnTo=...` → Create Account URL still has `returnTo` → finish join → browser goes to `/sso/authorize` then origin `?ticket=` — not `/`.
2. **SSO → Join → Sign In:** Create Account then Sign In; `returnTo` remains; sign-in still tickets back to origin.
3. **SSO → Use a different contact:** join URL still has `returnTo`.
4. **SSO → stay on Account Center → Log Out:** after logout, URL is `/signin?returnTo=...` (via `/sso/authorize`), not bare `/signin`.
5. **Direct `/join` and `/signin`:** after auth, `/`; after logout, `/signin` with no `returnTo`.
6. Run `bun test src/lib/sso-return.test.ts`, `bunx tsc --noEmit`, `bun run lint`.
