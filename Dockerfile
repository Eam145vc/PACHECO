# Build stage for React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
COPY server/ ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm ci --only=production

# Copy built frontend
COPY --from=frontend-build /app/dist /app/dist

# Create data directory for database files
RUN mkdir -p /app/server/data

# Expose port
EXPOSE 3002

# Start the server
WORKDIR /app/server
CMD ["node", "index.js"]