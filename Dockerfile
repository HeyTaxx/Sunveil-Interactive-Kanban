# ==============================================================================
# Sunveil Interactive Kanban & Mindmap - Production Server Dockerfile
# ==============================================================================
# Ultra-lightweight, hardened Alpine Node.js image (Zero binary executables)
FROM node:20-alpine

# Security: Non-root user setup
WORKDIR /app

# Copy application files
COPY . .

# Ensure data directory and permissions
RUN mkdir -p /app/data/boards && chown -R node:node /app

# Production environment variables
ENV NODE_ENV=production \
    SUNVEIL_SERVER=true \
    PORT=40293 \
    ALLOWED_HOSTS=*

# Expose standard Sunveil port
EXPOSE 40293

# Persistent data volume for boards, sessions, and configurations
VOLUME ["/app/data"]

# Run as non-root node user for security
USER node

# Start hardened 24/7 server daemon
CMD ["node", "server.js", "--server"]

