FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
RUN mkdir -p /app/datos && chown node:node /app/datos
USER node
ENV DIR_DATOS=/app/datos
EXPOSE 3000
CMD ["node", "src/servidor.js"]
