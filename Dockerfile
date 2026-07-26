FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY public ./public

ENV NODE_ENV=production

USER node

EXPOSE 3000

CMD ["npm", "start"]
