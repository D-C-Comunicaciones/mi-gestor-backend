# Etapa 1: dependencias (con dev para poder compilar)
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias necesarias para compilar canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev

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

# Etapa 3: dependencias de producción (sin dev)
FROM node:20-alpine AS prod-deps
WORKDIR /app

# Instalar dependencias necesarias para compilar canvas en prod
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev

COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# Etapa final: runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instalar solo librerías runtime necesarias para ejecutar canvas
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib

# (Opcional) user no-root:
# RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY public ./public

EXPOSE 3000

# HEALTHCHECK simple (opcional, descomenta si tienes /health)
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]