# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Copy bootstrap script
COPY docker-bootstrap.sh ./
RUN chmod +x docker-bootstrap.sh

# Generate Prisma client for production environment
RUN npx prisma generate

EXPOSE 3000

# Start the application via bootstrap script
CMD ["./docker-bootstrap.sh"]
