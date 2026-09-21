ARG BUN_VERSION=1
FROM oven/bun:${BUN_VERSION} AS base

# 依赖安装阶段
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# 运行阶段
FROM oven/bun:${BUN_VERSION}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid 1001 appuser

COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/public ./public

USER appuser
EXPOSE 3000
CMD ["bun", "server.js"]
