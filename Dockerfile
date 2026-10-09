# 完整版(含教師後台):建置網站 + 啟動伺服器,同一個服務同時提供網站與 API
FROM node:24-slim AS web
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

FROM node:24-slim
WORKDIR /srv
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
COPY app/src ./app/src
COPY --from=web /app/dist ./app/dist
ENV PORT=8080 DB_PATH=/data/electronics.db STATIC_DIR=/srv/app/dist NODE_ENV=production
EXPOSE 8080
VOLUME /data
WORKDIR /srv/server
CMD ["node", "node_modules/tsx/dist/cli.mjs", "src/main.ts"]
