FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

EXPOSE 5000

# Apply any pending migrations, then start the server. Uses `migrate deploy`
# (not `migrate dev`) — safe to run against a live database, applies existing
# migrations only, never generates new ones.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
