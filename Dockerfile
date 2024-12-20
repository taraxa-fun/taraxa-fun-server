# Build stage
FROM node:18 AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

# Start the application
CMD ["node", "dist/server.js"]