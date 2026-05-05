# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Clean install (best practice)
RUN npm ci

COPY . .

RUN npm run build


# ---------- Production Stage ----------
FROM nginxinc/nginx-unprivileged:alpine

USER root
RUN apk update && apk upgrade --no-cache

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html/ewer

# Nginx config
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Env script
COPY env.sh /env.sh
RUN chmod +x /env.sh

# Permissions
RUN chown -R nginx:nginx /usr/share/nginx/html/ewer

USER nginx

# Correct port
EXPOSE 80

# Correct healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["/bin/sh", "-c", "/env.sh && nginx -g 'daemon off;'"]