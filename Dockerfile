# --- build ---
# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update -y && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
COPY packages ./packages
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn,sharing=locked \
    yarn install --frozen-lockfile

COPY prisma ./prisma
COPY . .

RUN npx prisma generate
RUN yarn build

# --- runtime ---
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update -y && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r nodeapp -g 10001 \
    && useradd -r -g nodeapp -u 10001 -m -d /home/nodeapp -s /sbin/nologin nodeapp

# Prisma CLI only for Job migrate (app entrypoint does not migrate).
RUN npm install -g prisma@6.8.2

COPY package.json yarn.lock ./
COPY packages/domain-shared/package.json ./packages/domain-shared/package.json
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn,sharing=locked \
    yarn install --frozen-lockfile --production=true

COPY --from=builder /app/packages/domain-shared/dist ./packages/domain-shared/dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
  && chown -R nodeapp:nodeapp /app /home/nodeapp

USER 10001

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
