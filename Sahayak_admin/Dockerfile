# Stage 1: Build
FROM node:20-alpine AS builder

ARG VITE_ENCRYPTION_KEY
ENV VITE_ENCRYPTION_KEY=$VITE_ENCRYPTION_KEY

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config: serve SPA with fallback to index.html
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    client_max_body_size 50m;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api {\n\
        proxy_pass http://backend:5000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_request_buffering off;\n\
        proxy_read_timeout 120s;\n\
        proxy_send_timeout 120s;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
