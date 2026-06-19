# ── Build Stage ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Ensure both package.json and package-lock.json are copied
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npx tsc

# ── Production Stage ─────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini curl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S clipcapital && \
    adduser  -S clipcapital -u 1001 -G clipcapital

USER clipcapital

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
