# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/app
RUN npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built applications
COPY --from=builder /app/app/dist ./app/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/healthz || exit 1

# Start the application
CMD ["node", "backend/dist/index.js"]

