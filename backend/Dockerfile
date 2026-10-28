FROM node:20-alpine

# Install build tools needed for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

# Data directory for SQLite db
RUN mkdir -p /data

EXPOSE 3007

CMD ["node", "server.js"]
