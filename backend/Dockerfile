FROM node:24-slim AS builder


WORKDIR /app/backend

RUN corepack enable

COPY backend/package.json backend/pnpm-lock.yaml ./


RUN pnpm install

COPY backend/ .
RUN pnpm run build 

FROM node:24-slim

WORKDIR /app

RUN corepack enable

# copy built app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/pnpm-lock.yaml ./

# install only production deps
RUN pnpm install --prod

CMD ["node", "dist/main.js"]
