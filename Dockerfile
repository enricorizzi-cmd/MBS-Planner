# Multi-stage build for unified service
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev for build)
RUN npm install && \
    cd app && npm install && \
    cd ../backend && npm install

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev)
RUN npm install && \
    cd app && npm install && \
    cd ../backend && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd app && npm run build

# Build backend
RUN cd backend && NODE_ENV=production npm run build

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
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD ["node", "backend/dist/index.js"]