# Etapa 1: dependencias (con dev para compilar)
FROM node:20-alpine AS deps
WORKDIR /app

# Dependencias necesarias para canvas en compilación
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Etapa 2: build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Etapa 3: dependencias de producción
FROM node:20-alpine AS prod-deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
# Prisma generate no es necesario si lo quieres evitar

# Etapa final: runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Solo librerías runtime necesarias para canvas
RUN apk add --no-cache cairo pango jpeg giflib

# Usuario no root
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY public ./public
# Si necesitas seeds o migraciones en runtime, deja prisma:
COPY prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]
