# Multi-stage build for unified service
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --only=production && \
    cd app && npm install --only=production && \
    cd ../backend && npm install --only=production

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev)
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN cd app && npm run build

# Build backend
RUN cd backend && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/app/dist ./app/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "backend/dist/index.js"]