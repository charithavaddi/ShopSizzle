FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose server port
EXPOSE 5000

# Set default environment
ENV NODE_ENV=production

# Start Express server
CMD ["node", "src/server.js"]