# Step 1: Use official Bun Alpine image for fast package installations
FROM oven/bun:alpine AS deps
WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* bun.lockb* ./

# Install dependencies using Bun's native package manager
RUN bun install --frozen-lockfile

# Step 2: Build Next.js app using Bun runtime
FROM oven/bun:alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Run Next.js build using Bun
RUN bun run build

# Step 3: Minimal Node.js production runner (for maximum stability with Next.js)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Safely copy public directory from builder if present, or create empty if missing
RUN mkdir -p public
COPY --from=builder /app/publi[c] ./public

# Copy Next.js standalone build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 5000

CMD ["node", "server.js"]