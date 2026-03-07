# Stage 1: Build the React application
FROM node:18-alpine AS build

ARG VITE_ENCRYPTION_KEY
ENV VITE_ENCRYPTION_KEY=$VITE_ENCRYPTION_KEY

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist /usr/share/nginx/html

# We will provide a custom nginx config via docker-compose volume mapping
# or we can put a default one here. Let's create a default one directly.
RUN echo 'server { \
    listen 80; \
    client_max_body_size 50m; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html =404; \
    } \
    location /api/ { \
        proxy_pass http://backend:5000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_request_buffering off; \
        proxy_read_timeout 120s; \
        proxy_send_timeout 120s; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
