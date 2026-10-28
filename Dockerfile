FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/vss.conf

# Copy the app
COPY index.html /usr/share/nginx/html/apps/vss/index.html

EXPOSE 3006
