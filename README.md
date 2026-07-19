# Yadah TV Account Management App

This project is the shared user account management application for PHD Ministries. It is the central account hub where users can create and manage their account once, and then use that same account to access all PHD Ministries apps.

## Overview

Users should not need to create separate accounts for every PHD Ministries application. Instead, this app provides a single sign-on style account experience so one account can be used across the full ecosystem of PHD Ministries products.

This repository is built with Next.js and uses Bun as the package manager and task runner.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- Formik + Yup
- Axios
- Hero UI
- Bun

## Prerequisites

Make sure Bun is installed on your machine:

```bash
bun --version
```

## Getting Started

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
```

## Project Structure

```text
.
├── public/                        # Static assets
├── src/
│   ├── app/                       # App Router entry points and global styling
│   ├── components/                # Reusable UI components
│   │   ├── forms/                 # Form-related components
│   │   ├── inputs/                # Input field components
│   │   ├── modals/                # Modal components
│   │   └── navigation/            # Navigation-related UI
│   ├── hooks/                     # Application hooks
│   ├── lib/                       # Shared utilities and session helpers
│   ├── stores/                    # Zustand state stores
│   ├── types/                     # TypeScript interfaces and types
│   ├── validations/               # Form validation schemas
│   ├── countries.ts               # Country list data
│   ├── gender-options.ts          # Gender option constants
│   └── phone-codes.ts             # Phone code lookup data
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── package.json                   # Project scripts and dependencies
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

## Notes

- This app is the account source of truth for user management across PHD Ministries apps.
- Users create one account here and reuse it across the wider app ecosystem.
- Development and package management should be done with Bun only.
- Do not use npm, yarn, or pnpm for this project workflow.
