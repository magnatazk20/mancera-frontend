# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# A variável pode ser passada como build-arg pelo Easypanel
ARG VITE_API_URL=https://api.pgl-m.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copia build gerado para /adf/ (subpath onde o app é servido)
COPY --from=builder /app/dist /usr/share/nginx/html/adf

# Config nginx: serve o app em /adf/ com suporte a SPA (React Router)
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
\n\
  location = /adf {\n\
    return 301 /adf/;\n\
  }\n\
\n\
  location /adf/ {\n\
    try_files $uri $uri/ /adf/index.html;\n\
  }\n\
\n\
  gzip on;\n\
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
