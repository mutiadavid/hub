FROM node:18-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS runner

USER root
RUN apk update && apk upgrade --no-cache

COPY --from=builder /app/build /usr/share/nginx/html/digital-ipf-portal
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY env.sh /env.sh

RUN chown -R nginx:nginx /usr/share/nginx/html/digital-ipf-portal && \
    chmod -R 755 /usr/share/nginx/html/digital-ipf-portal && \
    chmod +x /env.sh

USER nginx


HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5173/digital-ipf-portal || exit 1

EXPOSE 5173

CMD ["/bin/sh", "-c", "/env.sh && nginx -g 'daemon off;'"]


