# ========== BUILD STAGE ==========
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Install runtime & build deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copy source + build Next.js
COPY . .
RUN npm run build

# ========== RUN STAGE ==========
FROM node:18-alpine
WORKDIR /app

# 4. Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 5. Copy built assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# 6. Env & port
ARG PORT=3003
ENV NODE_ENV=production
ENV PORT=${PORT}
EXPOSE ${PORT}

# 7. Start Next.js
CMD ["npx", "next", "start", "-p", "3003"]
