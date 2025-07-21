# --------------> The build image
FROM node:20.9.0-bullseye-slim AS build

# Install dumb-init and pnpm
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including devDependencies for build)
RUN --mount=type=secret,mode=0644,id=npmrc,target=/usr/src/app/.npmrc \
    pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the TypeScript application
RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

# --------------> The production image
FROM node:20.9.0-bullseye-slim

# Set production environment
ENV NODE_ENV=production

# Copy dumb-init from build stage
COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init

# Create app directory and set ownership
WORKDIR /usr/src/app

# Copy production dependencies and built application with correct ownership
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/package.json ./package.json

# Switch to non-root user
USER node

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application directly with node
CMD ["node", "dist/index.js"]