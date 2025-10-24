# =========================
# Etapa 1: Dependencias (incluye dev)
# =========================
FROM node:20-alpine AS deps

WORKDIR /app

# Instalar dependencias necesarias para compilar canvas + fuentes
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    fontconfig \
    ttf-dejavu

COPY package*.json ./
COPY prisma ./prisma

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci
RUN npx prisma generate

# =========================
# Etapa 2: Build
# =========================
FROM node:20-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# =========================
# Etapa 3: Dependencias de producción
# =========================
FROM node:20-alpine AS prod-deps

WORKDIR /app

# Instalar dependencias necesarias para compilar canvas + fuentes
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    fontconfig \
    ttf-dejavu

COPY package*.json ./
RUN npm ci --omit=dev

# ✅ Agregar ts-node y typescript para poder ejecutar el seed en prod
RUN npm install ts-node typescript

COPY prisma ./prisma
RUN npx prisma generate

# =========================
# Etapa final: Runtime
# =========================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Instalar librerías necesarias para canvas en runtime
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    fontconfig \
    ttf-dejavu

# (Opcional) crear usuario no-root
RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY public ./public

EXPOSE 3000

# HEALTHCHECK simple (opcional)
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1

# Ejecutar migraciones y levantar la app
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]