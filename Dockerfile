FROM oven/bun:canary-alpine AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app
COPY . .
RUN bun install

# 打包阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# 只复制必要的文件
COPY --from=builder /app/.next ./next
COPY --from=builder /app/public ./public
# 删除cache文件夹，如果有
RUN rm -rf ./next/cache

EXPOSE 3000

CMD ["bun", "./.next/standalone/server.js"] 