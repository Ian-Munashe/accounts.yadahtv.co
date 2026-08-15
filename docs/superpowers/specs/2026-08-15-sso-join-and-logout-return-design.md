# SSO return after join and logout

Date: 2026-08-15  
Status: draft for review

## Problem

External apps send users here through `GET /sso/authorize`. If there is no session, they land on `/signin?returnTo=...`. After **sign-in**, this app already resumes SSO (ticket → origin app).

Two gaps:

1. **Create account.** The Create Account link drops `returnTo`. After registration, `AccountRegistrationForm` always sends the user to `/`. They stay on the Account Center dashboard instead of returning to the origin app.
2. **Log out.** After a session that started from an external app, logout always goes to `/signin` with no SSO context. The origin app is forgotten.

## Goals

- If the user arrived via SSO and **creates an account**, send them through the same SSO ticket handshake as sign-in (back to the origin app). If they did not arrive via SSO, keep sending them to `/`.
- Keep `returnTo` when they switch between **Create Account**, **Sign In**, and **Use a different contact**.
- If the user **logs out** after arriving via SSO, send them back through `/sso/authorize` so they remain in that origin app’s SSO loop (unauthenticated authorize → `/signin?returnTo=...`). Direct Account Center logins still go to `/signin` with no `returnTo`.

## Non-goals

- No new backend API endpoints.
- No change to ticket issuance, refresh, or `/sso/authorize` query contract (`redirect`, `deviceId`, `clientId`).
- No sessionStorage / extra cookies for the return URL.
- No redirect to the origin app **without** a ticket after logout (that would skip this app’s SSO entry). Logout with SSO context goes to `/sso/authorize`, which then bounces to sign-in with `returnTo` because there is no session.

## Current behavior (sign-in)

1. Origin app → `/sso/authorize?redirect=<origin>&deviceId=...&clientId=...`
2. No session → `/signin?returnTo=/sso/authorize?...` (pathname + search of authorize)
3. After OTP + `create-session` + `getUser`:
   - `returnTo` present → `/sso/authorize?redirect=<urlencoded returnTo>`
   - else → `/`
4. Authorize unwraps nested `redirect` / `deviceId` / `clientId`, posts `/sso/ticket`, redirects origin URL with `?ticket=`

Join and logout do not participate in steps 3–4 today.

## Design

### 1. Query string on auth pages

Carry the existing `returnTo` search param (do not invent a second name).

| Link | Target |
|------|--------|
| Sign-in → Create Account | `/join?returnTo=...` when `returnTo` is present, else `/join` |
| Join → Sign In | `/signin?returnTo=...` when present, else `/signin` |
| Use a different contact | `/join?returnTo=...` when present, else `/join` |

`returnTo` is the same value sign-in already uses (typically `/sso/authorize?redirect=...&deviceId=...&clientId=...`).

### 2. Shared path helpers

Add a small client-safe module `src/lib/sso-return.ts` (no `NextRequest`):

- `authPathWithReturnTo(path, returnTo)` — `/signin` or `/join`, append `returnTo` when set
- `ssoResumePath(returnTo)` — `/sso/authorize?redirect=` + encoded `returnTo` (same construction as today’s sign-in page)
- `resumeAfterAuth(returnTo)` — `ssoResumePath` or `/`
- `resumeAfterLogout(returnTo)` — `ssoResumePath` or `/signin`

Sign-in success and registration success both call `resumeAfterAuth`. Logout calls `resumeAfterLogout`.

### 3. Persist `ssoReturnTo` on iron-session

Query strings are gone once the user is on `/` or other protected pages. Logout from the dashboard still needs the origin.

- Extend ambient `ISession` with optional `ssoReturnTo?: string`.
- `updateSession` may set `ssoReturnTo` when the caller passes it. Do not clear it when updating tokens/user only.
- `deleteSession` already destroys the whole cookie; that clears `ssoReturnTo`.

**When to write it**

- `redirectToSignin` in `src/app/(authentication)/sso/authorize/route.ts`: `updateSession({ ssoReturnTo: request.nextUrl.pathname + request.nextUrl.search })` before redirecting to `/signin`.
- Sign-in and join client pages: if `searchParams.get("returnTo")` is set, `updateSession({ ssoReturnTo: returnTo })` so a user who already has the query (or refreshed) still persists it.

**When to read it**

- Registration success: prefer URL `returnTo`, else `session.ssoReturnTo`, then `resumeAfterAuth`.
- Sign-in success: same (URL already has it today; session is backup).
- Logout: `getSession()`, capture `ssoReturnTo`, sign out + `deleteSession()`, then `resumeAfterLogout(ssoReturnTo)`.
- `proxy.ts` guest routes: if authenticated and (`returnTo` query **or** `session.ssoReturnTo`), redirect to `ssoResumePath(...)` instead of `/`.

Do not treat a half-filled session as logged in. `ssoReturnTo` alone is not authentication.

### 4. Join / registration

`join/page.tsx` reads `returnTo` via `useSearchParams`, wires footer and “Use a different contact”, and passes `returnTo` into `AccountRegistrationForm`.

After `finish-signup` → `create-session` → `updateSession` tokens → `getUser` succeeds: `resumeAfterAuth(returnTo)` instead of `window.location.href = "/"`.

### 5. Logout

`useAuthentication().signOut` is the only logout entry (header dropdown). After `/user/signout` and `deleteSession`:

- SSO session (`ssoReturnTo` set) → `/sso/authorize?redirect=...` → no session → `/signin?returnTo=...` (origin app still attached)
- Direct session → `/signin`

If sign-out API fails, keep today’s toast; do not redirect.

### 6. Proxy

Guest routes `/signin` and `/join`:

- Authenticated + SSO resume target (query or session) → SSO resume (not `/`)
- Authenticated + no SSO target → `/` (unchanged)
- Unauthenticated → next (unchanged)

`/sso/authorize` is not a guest route; ticket logic stays in the authorize route.

## Files

| File | Role |
|------|------|
| `src/lib/sso-return.ts` | Path helpers (new) |
| `src/types/i-session.ts` | `ssoReturnTo?: string` |
| `src/actions/session-action.ts` | Persist `ssoReturnTo` in `updateSession` |
| `src/app/(authentication)/sso/authorize/route.ts` | Write `ssoReturnTo` in `redirectToSignin` |
| `src/app/(authentication)/signin/page.tsx` | Keep `returnTo` on Create Account; persist; `resumeAfterAuth` |
| `src/app/(authentication)/join/page.tsx` | Read/pass `returnTo`; Sign In link |
| `src/components/forms/account-registration-form.tsx` | Prop `returnTo`; resume after signup; keep param on “different contact” |
| `src/hooks/authentication-hook.ts` | Logout uses `resumeAfterLogout` |
| `src/proxy.ts` | Authenticated guest + SSO target → resume |
| `AGENTS.md` | Session shape + SSO resume after join/logout |

No new routes. No new env vars.

## Flows

**SSO → create account → origin**

1. Origin → `/sso/authorize?...` → `/signin?returnTo=...` (session stores `ssoReturnTo`)
2. Create Account → `/join?returnTo=...`
3. OTP + profile → session tokens
4. `resumeAfterAuth` → ticket → origin `?ticket=`

**SSO → join → Sign In → origin**

`returnTo` stays on `/signin`; existing sign-in resume runs.

**SSO → stay on Account Center → log out**

1. `ssoReturnTo` still on the cookie
2. Logout → `/sso/authorize?redirect=...` → `/signin?returnTo=...`

**Direct join or sign-in (no `returnTo`)**

Unchanged: after auth → `/`; after logout → `/signin`.

## Constraints (from AGENTS.md)

- Bun only, port 3001
- Do not invent APIs; do not weaken auth
- `updateSession` + `setUser` after user mutations that change the session user (signup already does `getUser`)
- Redirects that need a public origin on the server keep using `createAppUrl` / `getPublicOrigin`

## Success criteria

- SSO sign-in still returns to the origin app with a ticket.
- SSO then Create Account returns to the origin app with a ticket; user does not remain on `/`.
- Switching Create Account / Sign In / Use a different contact does not drop `returnTo`.
- Logout after an SSO arrival lands on `/signin?returnTo=...` (via `/sso/authorize`).
- Direct Account Center login/join/logout is unchanged.
- No secrets in docs or commits.
