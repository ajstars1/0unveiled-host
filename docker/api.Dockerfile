# Build stage
FROM node:22-alpine AS builder

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json bun.lockb turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN npm install -g bun
RUN bun install --frozen-lockfile

# Build the application
RUN bun run build --filter=@0unveiled/api

# Production stage
FROM node:22-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/package.json ./package.json

# Install production dependencies only
RUN npm install --only=production && npm cache clean --force

# Create logs directory
RUN mkdir -p logs && chown -R apiuser:nodejs logs

# Switch to non-root user
USER apiuser

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"] 