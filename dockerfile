# Docker Desktop's default bridge often cannot reach registry.npmjs.org.
# Build with: docker build --network=host -t aftms .

# ---------- Build ----------
FROM node:24-alpine AS build

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

# bcrypt (and similar) may need a toolchain on musl if no prebuild ships
RUN apk add --no-cache python3 make g++

COPY . .

RUN pnpm install --frozen-lockfile \
    --config.supportedArchitectures.os=linux \
    --config.supportedArchitectures.cpu=x64 \
    --config.supportedArchitectures.libc=musl

RUN pnpm build

# Pruned server tree only — no pnpm store, no client toolchain.
# dist/client are gitignored so they are copied explicitly after deploy.
RUN pnpm --filter server deploy --prod /deploy \
    && rm -rf /deploy/src \
    && cp -a /app/server/dist /deploy/dist \
    && mkdir -p /deploy/client-dist \
    && cp -a /app/server/client/. /deploy/client-dist/ \
    && mkdir -p /deploy/node_modules/@repo/shared \
    && cp -a /app/shared/package.json /deploy/node_modules/@repo/shared/package.json \
    && cp -a /app/shared/dist /deploy/node_modules/@repo/shared/dist \
    && find /deploy -name '*.map' -type f -delete


# ---------- Production ----------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /deploy ./

RUN rm -rf \
    /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack \
    /opt/yarn*

EXPOSE 3000
CMD ["node", "dist/index.js"]
