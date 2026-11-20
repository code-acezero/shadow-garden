# ========================================================
# KAGEMI HYBRID SINGLE-CONTAINER DOCKERFILE
# Deploys Next.js UI + Go Streaming Engine in ONE Click
# ========================================================

# --------------------------------------------------------
# 1. BUILD NATIVE GO GATEWAY & STREAMING ENGINE
# --------------------------------------------------------
FROM golang:1.22-alpine AS go-builder
WORKDIR /build
COPY engine/go.mod ./
COPY engine/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/kagemi-gateway .

# --------------------------------------------------------
# 2. INSTALL NODE DEPENDENCIES
# --------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# --------------------------------------------------------
# 3. BUILD NEXT.JS STANDALONE APPLICATION
# --------------------------------------------------------
FROM node:20-alpine AS next-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV STANDALONE=true

RUN npm run build

# --------------------------------------------------------
# 4. FINAL RUNNER (ULTRA-LEAN & FAST PRODUCTION IMAGE)
# --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=80
ENV NEXT_PORT=3001
ENV NEXT_URL=http://127.0.0.1:3001

# Copy native Go binary
COPY --from=go-builder /build/kagemi-gateway /usr/local/bin/kagemi-gateway

# Copy Next.js standalone server and static assets
COPY --from=next-builder /app/.next/standalone ./
COPY --from=next-builder /app/.next/static ./.next/static
COPY --from=next-builder /app/public ./public

# Copy and prepare startup supervisor script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh /usr/local/bin/kagemi-gateway

EXPOSE 80

CMD ["/app/start.sh"]
