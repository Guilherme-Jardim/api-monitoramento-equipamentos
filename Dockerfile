# DB_PROVIDER: sqlite (padrao) ou postgresql
FROM node:22-slim AS build
ARG DB_PROVIDER=sqlite
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN sed -i "s/provider = \"sqlite\"/provider = \"${DB_PROVIDER}\"/" prisma/schema.prisma \
    && npx prisma generate \
    && npm run build \
    && npm prune --omit=dev

FROM node:22-slim
ARG DB_PROVIDER=sqlite
ENV NODE_ENV=production DB_PROVIDER=${DB_PROVIDER}
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
