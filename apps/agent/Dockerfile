# Build context: repo root (.)
FROM node:22-slim AS base
RUN npm i -g pnpm@latest
WORKDIR /repo

# ── deps: install only agent and its workspace deps ──────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/agent/package.json ./apps/agent/package.json
RUN pnpm install --frozen-lockfile --filter @n2base/agent...

# ── builder: compile TypeScript ───────────────────────────────────────────────
FROM deps AS builder
COPY apps/agent ./apps/agent
RUN pnpm --filter @n2base/agent run build

# ── runtime: production image ─────────────────────────────────────────────────
FROM node:22-slim AS runtime
RUN npm i -g pnpm@latest
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/agent/package.json ./apps/agent/package.json
RUN pnpm install --frozen-lockfile --filter @n2base/agent... --prod
COPY --from=builder /repo/apps/agent/dist ./apps/agent/dist
WORKDIR /repo/apps/agent
EXPOSE 3001
CMD ["node", "dist/main.js"]
