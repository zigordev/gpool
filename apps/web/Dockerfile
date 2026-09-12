FROM node:24-alpine AS base
WORKDIR /workspace

FROM base AS deps-build
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN set -eux; \
  for attempt in 1 2 3; do \
    HUSKY=0 npm ci --workspace @gpool/web --include-workspace-root --ignore-scripts && break; \
    if [ "$attempt" -eq 3 ]; then \
      exit 1; \
    fi; \
    echo "npm ci failed (attempt $attempt), retrying in 10s..."; \
    sleep 10; \
  done

FROM base AS deps-prod
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY scripts/prepare-husky.mjs scripts/prepare-husky.mjs
RUN set -eux; \
  for attempt in 1 2 3; do \
    HUSKY=0 npm ci --workspace @gpool/web --include-workspace-root --omit=dev --ignore-scripts && break; \
    if [ "$attempt" -eq 3 ]; then \
      exit 1; \
    fi; \
    echo "npm ci failed (attempt $attempt), retrying in 10s..."; \
    sleep 10; \
  done

FROM base AS build
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_RELEASE
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_RELEASE=${NEXT_PUBLIC_RELEASE}
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY package.json /workspace/package.json
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
RUN mkdir -p public && npm run build

FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN apk upgrade --no-cache zlib libcrypto3 libssl3 \
 && rm -rf /usr/local/lib/node_modules/npm /opt/yarn-v1.22.22 \
 && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
COPY --from=deps-prod /workspace/node_modules /app/node_modules
COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /workspace/apps/web/public ./apps/web/public
COPY --from=build /workspace/apps/web/messages ./apps/web/messages
COPY scripts/openbao-run.mjs /app/scripts/openbao-run.mjs
USER node
EXPOSE 3001
CMD ["node", "apps/web/server.js"]

FROM prod AS local

FROM base AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps-build /workspace/node_modules /workspace/node_modules
COPY package.json package-lock.json /workspace/
COPY scripts/openbao-run.mjs /workspace/scripts/openbao-run.mjs
COPY apps/web /workspace/apps/web
WORKDIR /workspace/apps/web
EXPOSE 3001
CMD ["npm", "exec", "--", "next", "dev", "-H", "0.0.0.0", "-p", "3001"]
