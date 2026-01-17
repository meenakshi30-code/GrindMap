# Backend Dockerfile for GrindMap
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start", "--", "--legacy-watch"]
