# --- Backend Dockerfile ---
FROM node:20-alpine AS base

# Final Image
FROM base AS final
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
