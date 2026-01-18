# Frontend Dockerfile for GrindMap
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose frontend port
EXPOSE 3000

# Start the development server with direct react-scripts invocation for proper signal handling
CMD ["npx", "react-scripts", "start"]
