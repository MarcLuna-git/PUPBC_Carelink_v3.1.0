# Dockerfile for PUPBC CareLink Frontend (React 19 / Vite)
# Multi-stage build: build the app, then serve with a lightweight server.
# Build context is the frontend/ directory (rootDir in render.yaml).

# ============================================
# Build Stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Vite bakes VITE_* variables into the JS bundle at BUILD time.
# Declaring ARGs with the same names as Render environment variables
# makes Render pass their dashboard values into this Docker build
# automatically (otherwise they are undefined during `npm run build`).
ARG VITE_API_URL
ARG VITE_APP_NAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the application
RUN npm run build

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve (lightweight static file server)
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port (Render sets $PORT env var)
EXPOSE $PORT

# Serve the built application
CMD ["sh", "-c", "serve -s dist -l $PORT"]
