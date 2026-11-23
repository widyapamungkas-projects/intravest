# Build dari ROOT repo:  docker build -f admin/Dockerfile -t intravest-admin .
FROM node:22-alpine AS build
WORKDIR /app/admin
COPY admin/package.json admin/package-lock.json ./
RUN npm ci
COPY admin/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production DATA_DIR=/data PORT=8787
WORKDIR /app
COPY --from=build /app/admin/node_modules ./node_modules
COPY --from=build /app/admin/dist ./dist
COPY --from=build /app/admin/package.json ./
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8787/api/auth/me || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/server/index.js"]
