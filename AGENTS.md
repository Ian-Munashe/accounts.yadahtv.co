# AGENTS.md — Yadah TV Account Center

**Follow this file on every turn.** It is mandatory for AI agents and contributors working in this repository. Read it before exploring, changing, or reviewing code. Do not skip it because the task looks small.

## Cursor rules (required)

Cursor project rules live in [`.cursor/rules/`](.cursor/rules/). They are part of this playbook, not optional extras. **Read and obey every `.mdc` file in that folder** in addition to this document.

| File | Scope |
|------|--------|
| [`.cursor/rules/project.mdc`](.cursor/rules/project.mdc) | Always on (`alwaysApply: true`). Short non-negotiables and file pointers. Canonical detail stays here. |

If you add, rename, or remove a Cursor rule, update this table in the same change. Keep rules concise; put full guidance in this file.

### Precedence

1. Explicit user instruction for the current turn
2. This file (`AGENTS.md`)
3. Cursor rules in `.cursor/rules/`

If a Cursor rule and this file disagree, follow this file, then update the rule so they match. After a one-turn user override, keep later changes consistent with this playbook.

## Mission

This app is the **central account hub** for PHD Ministries / Yadah TV. Users create and manage **one account** here and reuse it across PHD Ministries products via SSO.

- Product name in UI/metadata: **Yadah TV Account Center**
- Package / deploy name: `accounts.yadahtv.co`
- Role: account source of truth (profile, contacts, devices, admin users/apps) — **not** a general content or media app
- Brand accent: `#e40816` (theme tokens use matching oklch accent in `src/app/globals.css`)

Do not turn this into an unrelated product. Prefer extending existing account/SSO/admin flows.

## Hard constraints

1. **Bun only** — install, run, and script with Bun. Never use npm, yarn, or pnpm.
2. **Do not invent backend APIs** — this frontend talks to an external API (`NEXT_PUBLIC_API_URL`). Only call endpoints already used in the codebase unless the user explicitly provides new API contracts.
3. **Do not weaken auth** — keep iron-session, `proxy.ts` guards, token refresh, and SSO ticket flow intact unless the task is a deliberate security change.
4. **Never commit secrets** — no `.env`, `.env.local`, credentials, or private keys. Reference env **names** only.
5. **Match existing patterns** — copy local conventions (hooks, stores, Formik inputs, HeroUI usage, barrel exports) before introducing new libraries or architectures.
6. **Port is 3001** — `dev`, `start`, and Docker expose **3001**. Trust `package.json` / Dockerfile over older docs.

## Tech stack

| Area | Choice |
|------|--------|
| Runtime / PM | Bun |
| Framework | Next.js 16 (App Router), `output: "standalone"` |
| UI | React 19, HeroUI v3 (`@heroui/react`, `@heroui/styles`), Tailwind CSS v4 |
| Data | Axios, TanStack React Query, Zustand + immer |
| Forms | Formik + Yup |
| Session | iron-session (server actions) |
| Device | `@capacitor/device` (client id for this app is `"accounts"`) |
| PWA | `next-pwa` → `public/sw.js` |
| Quality | TypeScript strict, ESLint (next), Prettier (`printWidth: 120` + Tailwind plugin) |
| Compiler | React Compiler enabled (`reactCompiler: true`) |

Path alias: `@/*` → `./src/*`.

## Commands

```bash
bun install
bun run dev      # http://localhost:3001
bun run build    # next build --webpack
bun run start    # standalone server on 3001
bun run lint
```

Production image: multi-stage `Dockerfile` (Bun deps/build → Node 20 Alpine runner).

## Repository map

```text
src/
  app/                    # App Router
    (authentication)/     # guest: /signin, /join, /sso/authorize
    (protected)/          # authenticated shell + Header
      (admin)/            # /users, /applications
  actions/                # "use server" session actions
  components/             # UI by kind: cards, drawers, forms, inputs, modals, navigation
  hooks/                  # axios, auth, devices, pagination
  stores/                 # Zustand stores
  lib/                    # utils, request URL helpers, animations, mask
  types/                  # ambient interfaces (i-*.ts) — no imports needed
  validations/            # Yup schemas
  proxy.ts                # route auth / role gates (Next.js proxy, not middleware.ts)
  session-options.ts      # iron-session cookie config
  permissions.ts          # cross-app permission catalog for admin UI
```

Barrel files (`index.ts`) exist under hooks, stores, validations, and many component folders — prefer importing from barrels when they export the symbol.

## Routing & access control

Route protection lives in **`src/proxy.ts`** (matcher excludes `api`, `_next/static`, `_next/image`, `favicon.ico`).

| Kind | Paths | Rules |
|------|-------|--------|
| Guest | `/signin`, `/join` | If already authenticated: resume SSO when `returnTo` or session `ssoReturnTo` is set, otherwise `/` |
| Protected | `/`, `/profile`, `/devices`, `/users`, `/applications` | Require session (`accessToken` + `refreshToken` + `user`) |
| Admin | `/users` | `superadmin` or `admin` |
| Superadmin | `/applications` | `superadmin` only |

Nav roles mirror this in `src/components/navigation/menu-items.tsx`.

When adding a page:

1. Place it under the correct route group.
2. Update `proxy.ts` guest/protected/role lists if needed.
3. Update `menuItems` if it should appear in nav.
4. Prefer a co-located `layout.tsx` for page title/metadata patterns used nearby.

Redirects must use **`createAppUrl` / `getPublicOrigin`** from `src/lib/request-url.ts` so hosts like `0.0.0.0` never leak into client redirects. Prefer `APP_URL` / `NEXT_PUBLIC_APP_URL` when set.

## Session & auth model

- Session shape (`ISession`): optional `user`, `accessToken`, `refreshToken`, `ssoReturnTo`.
- Cookie config: `src/session-options.ts` — `NEXT_AUTH_SECRET`, `NEXT_COOKIE_NAME`; `secure` in production; long-lived cookie via `Utils`.
- Server actions: `src/actions/session-action.ts` — `getSession`, `updateSession`, `deleteSession` (always serialize with `JSON.parse(JSON.stringify(...))` after iron-session ops).
- Client bootstrap: `Providers` loads device info + session, then hydrates `useUserState`.
- Sign-in / join: OTP + identifier flows (email or phone) via forms under `components/forms`.
- Sign-out / destructive confirms: `useModalState().showModal` + `toast` for errors.
- **SSO**: `GET /sso/authorize` issues a backend ticket and redirects to the client app with `?ticket=...`. Requires `redirect`, `deviceId`, `clientId`. On 401, refresh tokens then retry; otherwise send user to `/signin` with `returnTo` and persist `ssoReturnTo` on the session. Sign-in and join must keep `returnTo` on Create Account / Sign In / Use a different contact links (`src/lib/sso-return.ts`). After sign-in or account creation, call `resumeAfterAuth`. After logout, call `resumeAfterLogout` using `ssoReturnTo` captured before `deleteSession`.

Authenticated = presence of access token, refresh token, **and** user. Do not treat a half-filled session as logged in.

## API & networking

- Base URL: `process.env.NEXT_PUBLIC_API_URL`.
- Use **`useAxios()`**:
  - `axios` — unauthenticated / pre-session calls (e.g. signup finish).
  - `interceptor` — authenticated calls (attaches Bearer token; refreshes on 401; clears session and sends to `/signin` on refresh failure; 403 → `/`).
- Device headers (when available): `X-Client-Id` (always `"accounts"` from store), `X-Model`, `X-Platform`, `X-Device-Id`, `X-Operating-System`.
- Lists: prefer **`usePaginatedQuery`** for admin-style paginated endpoints.
- Errors: `toast.danger(error.response?.data?.message || error.message)` unless a local pattern differs.
- Loading overlays for longer mutations: `useGlobalState().setIsProgress`.

Known endpoint families already in use include `/user`, `/user/*`, `/contacts/*`, `/devices/*`, `/admin/users`, SSO `/sso/ticket`, and application admin routes used by application cards/modals. Grep the repo before adding calls.

## State management

| Store | Purpose |
|-------|---------|
| `useUserState` | Current user |
| `useModalState` | Global confirm/alert modal |
| `useGlobalState` | Progress / shared UI flags |
| `useDeviceInfoState` | Capacitor device + `clientId: "accounts"` |
| `useOTPWaitState` | OTP cooldown / wait |
| `useUsersListState` | Users list helpers (`data-state`) |

Zustand stores use **immer** middleware. Keep stores thin; put API orchestration in hooks.

React Query defaults (in `Providers`): `staleTime` 5 minutes, `refetchOnWindowFocus: false`.

## Forms & validation

- Formik for form state; Yup schemas in `src/validations/`.
- Reuse shared inputs: `TextField`, `SelectInput`, `AutocompleteInput`, `TextArea`, `DateTimePicker` — they expect a `formik` prop and field `name`.
- Validation behavior: HeroUI `Form` with `validationBehavior="aria"`; show field errors when touched or after submit.
- Auth action strings used in schemas include: `sign-in`, `sign-up`, `add-contact`, `change-contact`, `verify-current-contact`, `change-identifier`.

## UI conventions

- Prefer **HeroUI v3** primitives (`Button`, `Surface`, `Form`, `Toast`, compound parts, etc.). This project uses HeroUI v3 patterns (no v2 Provider).
- Icons: primarily `react-icons` (`lu`, `md`, `ri`, `pi`, …).
- Theming: CSS variables in `globals.css`; root layout defaults to dark (`data-theme="dark" className="dark"`); `next-themes` in Providers.
- Layout: protected pages use `Header` + `container mx-auto max-w-7xl` content.
- Page intros: `BreadCrumb` with title + short description.
- Motion helpers live in `src/lib/animations.ts` when needed; do not add heavy animation libraries without need.
- Prettier Tailwind class sorting is enabled — don’t fight class order in reviews.

Preserve the existing visual language (accent red, surfaces, rounded auth cards). Do not impose unrelated “AI default” themes.

## Types

- Domain types live as **ambient interfaces** in `src/types/i-*.ts` (e.g. `IUser`, `ISession`, `IDevice`) — they are **not** exported modules; use them without importing.
- `IUser.role`: `"superadmin" | "admin" | "user"`.
- `IUser.status`: `"active" | "suspended"`.
- Keep new shared types in the same `i-*.ts` style unless the file already uses exported types.

## Permissions catalog

`src/permissions.ts` lists permission categories for admin editing (Account, The View, Yadah Basket, etc.). Values are opaque strings consumed by the backend (e.g. `login`, `users`, `theview:admin`, `yb:payments`). Categories may set `exclusive: true` so the permissions drawer allows at most one selection in that category (radio-style replace). Add new permissions here only when product/backend defines them.

## Environment variables (names only)

| Name | Role |
|------|------|
| `NEXT_PUBLIC_API_URL` | External API base URL |
| `NEXT_AUTH_SECRET` | iron-session password |
| `NEXT_COOKIE_NAME` | Session cookie name |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | Public origin for redirects |
| `NODE_ENV` | Affects cookie `secure` |
| `PORT` | Defaults toward 3001 in helpers |

Never print or commit values from `.env.local`.

## Coding standards

- TypeScript strict; prefer existing file style (double quotes, Prettier width 120).
- Client components: `"use client"` at top when using hooks/browser APIs.
- Server actions: `"use server"` in `src/actions/`.
- Named exports for components/hooks; default exports for Next.js `page.tsx` / `layout.tsx`.
- After user mutations that change the session user, update **both** `updateSession({ user })` and `setUser(...)`.
- Prefer small, focused files colocated by feature kind (forms/inputs/modals) rather than new top-level folders.
- Avoid adding dependencies when an existing package already covers the need.
- Do not add `useMemo` / `useCallback` by default; React Compiler is on. Follow existing local usage.
- Keep comments rare and useful; do not leave debug `console.log` or commented-out redirect hacks.

## Change checklist

Before finishing a task:

1. Confirm Bun-only workflow and port **3001** assumptions still hold.
2. If routes changed → update `proxy.ts` (+ nav if needed).
3. If session/user data changed → keep session cookie and Zustand user in sync.
4. If calling API → use `useAxios` correctly (`axios` vs `interceptor`) and handle toast errors.
5. If UI → HeroUI + existing inputs/cards; match spacing/typography of neighboring pages.
6. If Cursor rules changed → keep the table in this file in sync with `.cursor/rules/`.
7. Do not touch `.env.local` contents in commits or paste secrets into docs.

## Out of scope unless explicitly requested

- Rewriting auth to NextAuth/Auth.js or another session library
- Replacing HeroUI, Formik, Zustand, or Axios wholesale
- Switching package managers
- Implementing or documenting the backend API server itself
- Force-pushing, amending published history, or committing without being asked
