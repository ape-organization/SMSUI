# ---- Build stage ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ---- Runtime stage ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/sms/browser /usr/share/nginx/html

# Backend that /api requests are proxied to
ENV API_UPSTREAM=http://host.docker.internal:5000

EXPOSE 80
