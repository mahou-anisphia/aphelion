# ── Stage 1: Build Angular frontend ───────────────────────────────────────────
FROM node:22-alpine AS fe-builder
WORKDIR /build/fe

COPY fe/package.json fe/package-lock.json ./
RUN npm ci

COPY fe/ ./
RUN npm run build
# Output: /build/fe/dist/aphelion/browser/

# ── Stage 2: Install backend dependencies ─────────────────────────────────────
FROM node:22-alpine AS be-deps
WORKDIR /build/be

RUN npm install -g pnpm
COPY be/package.json be/pnpm-lock.yaml ./
# Install all deps (including tsx needed at runtime)
RUN pnpm install --frozen-lockfile

# ── Stage 3: Production image ──────────────────────────────────────────────────
FROM node:22-alpine AS final
WORKDIR /app

# Backend
COPY --from=be-deps /build/be/node_modules ./node_modules
COPY be/src ./src
COPY be/drizzle ./drizzle
COPY be/package.json ./

# Angular static files — served by Express in production
COPY --from=fe-builder /build/fe/dist/aphelion/browser ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node_modules/.bin/tsx", "src/app.ts"]
