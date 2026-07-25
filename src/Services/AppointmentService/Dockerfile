# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Runtime stage
FROM node:22-alpine
WORKDIR /app

# Copy from build stage
COPY --from=build /app .

ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

CMD ["node", "src/index.js"]
