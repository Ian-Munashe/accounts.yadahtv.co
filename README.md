# Yadah TV Account Center

Central account hub for PHD Ministries / Yadah TV. Users create and manage **one account** here and reuse it across PHD Ministries products via SSO.

- Product name: **Yadah TV Account Center**
- Package / deploy name: `accounts.yadahtv.co`
- Local and production app port: **3001**

This frontend is the account source of truth (profile, contacts, devices, admin users/apps). It is not a general content or media app. It talks to an external API (`NEXT_PUBLIC_API_URL`); this repository does not implement that API.

**AI agents and contributors:** follow [`AGENTS.md`](./AGENTS.md) on every change. Cursor project rules are listed from that file and live in [`.cursor/rules/`](./.cursor/rules/).

## Overview

Users should not need a separate account for every PHD Ministries application. This app provides:

- Sign in / join with OTP (email or phone)
- Profile, contact, and device management
- SSO ticket flow at `/sso/authorize` for client apps
- Admin user management (`admin` / `superadmin`)
- Application registration (`superadmin` only)

## SSO

Client apps (`yb`, `theview`) use **this app only** to start SSO:

1. `GET /sso/authorize?redirect=...&deviceId=...&clientId=yb|theview`
2. After sign-in if needed, Accounts returns `{redirect}?t=` (ticket TTL **60s — never save it**)
3. The client exchanges on Auth API `GET /sso/exchange?t=` and stores `accessToken` / `refreshToken`

Hand the client AI [`DOC_SSO.md`](./DOC_SSO.md), then Auth API `DOC_SSO.md` for exchange.

| After | SSO authorize in progress | Direct Accounts visit |
|-------|---------------------------|------------------------|
| Sign in or create account | Resume `/sso/authorize` → origin `?t=` | `/` |
| Log out | Origin callback with no `t` | `/signin` |

Create Account, Sign In, and Use a different contact keep `returnTo` on the URL. Path helpers live in `src/lib/sso-return.ts`.

Authenticated means access token, refresh token, **and** user are all present. `ssoReturnTo` alone is not a login. Route gates are in `src/proxy.ts`.

## Tech stack

| Area | Choice |
|------|--------|
| Runtime / package manager | Bun |
| Framework | Next.js 16 (App Router), standalone output |
| UI | React 19, HeroUI v3, Tailwind CSS v4 |
| Data | Axios, TanStack React Query, Zustand + immer |
| Forms | Formik + Yup |
| Session | iron-session (server actions) |
| Device | `@capacitor/device` (client id `accounts`) |
| PWA | `next-pwa` |

Path alias: `@/*` → `./src/*`.

## Prerequisites

Install [Bun](https://bun.sh) and confirm it is available:

```bash
bun --version
```

Use **Bun only**. Do not use npm, yarn, or pnpm.

## Getting started

Install dependencies:

```bash
bun install
```

Copy local env from your secrets store into `.env.local` (never commit that file). Required names are listed below.

Run the development server:

```bash
bun run dev
```

Open http://localhost:3001 in your browser.

## Available scripts

```bash
bun run dev      # Next.js dev server on port 3001
bun run build    # next build --webpack
bun run start    # standalone server on port 3001
bun run lint
bun test         # Bun test runner (`tests/`)
```

Production Docker image: multi-stage `Dockerfile` (Bun install/build, Node 20 Alpine runner, port **3001**).

## Environment variables (names only)

Set these in `.env.local` or the host environment. Never commit values.

| Name | Role |
|------|------|
| `NEXT_PUBLIC_API_URL` | External API base URL |
| `NEXT_AUTH_SECRET` | iron-session password |
| `NEXT_COOKIE_NAME` | Session cookie name |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | Public origin for redirects |
| `NODE_ENV` | Affects cookie `secure` |
| `PORT` | Defaults toward 3001 |

## Project structure

```text
.
├── public/                        # Static assets, PWA icons, sw.js
├── src/
│   ├── app/                       # App Router
│   │   ├── (authentication)/      # /signin, /join, /sso/authorize
│   │   └── (protected)/           # authenticated shell + /devices, /users, /applications
│   ├── actions/                   # Server actions (session)
│   ├── components/                # cards, drawers, forms, inputs, modals, navigation
│   ├── hooks/                     # axios, auth, devices, pagination
│   ├── lib/                       # utils, SSO return helpers, public URLs, animations
│   ├── stores/                    # Zustand stores
│   ├── types/                     # Ambient interfaces (i-*.ts)
│   ├── validations/               # Yup schemas
│   ├── proxy.ts                   # Route auth / role gates
│   ├── session-options.ts         # iron-session cookie config
│   └── permissions.ts             # Cross-app permission catalog
├── tests/                         # Bun tests (do not colocate `*.test.ts` under src/)
├── DOC_SSO.md                     # Client SSO authorize (60s ticket → Auth exchange)
├── AGENTS.md                      # Mandatory agent / contributor playbook
├── Dockerfile
├── package.json
└── README.md
```

## Notes

- Development and package management must use Bun only.
- Do not invent API endpoints; grep the repo for existing contracts first.
- Do not commit `.env`, `.env.local`, credentials, or private keys.
- Full conventions (auth, SSO, UI, types, change checklist) are in [`AGENTS.md`](./AGENTS.md).
