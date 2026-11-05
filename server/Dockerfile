FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5000
# The server creates the tables on start-up, so no separate migrate step is needed
CMD ["node", "src/server.js"]
