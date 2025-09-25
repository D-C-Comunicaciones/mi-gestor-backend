-- CreateTable
CREATE TABLE "public"."companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "Nit" INTEGER NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currencies" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."timezones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "offset" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timezones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configurations" (
    "id" SERIAL NOT NULL,
    "currencyId" INTEGER,
    "timezoneId" INTEGER,
    "colorPalette" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "public"."companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_Nit_key" ON "public"."companies"("Nit");

-- CreateIndex
CREATE UNIQUE INDEX "companies_phone_key" ON "public"."companies"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "public"."companies"("email");

-- CreateIndex
CREATE INDEX "companies_name_Nit_phone_email_createdAt_updatedAt_idx" ON "public"."companies"("name", "Nit", "phone", "email", "createdAt", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "public"."currencies"("code");

-- CreateIndex
CREATE INDEX "currencies_code_name_isActive_idx" ON "public"."currencies"("code", "name", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "timezones_name_key" ON "public"."timezones"("name");

-- CreateIndex
CREATE INDEX "timezones_name_offset_isActive_idx" ON "public"."timezones"("name", "offset", "isActive");

-- CreateIndex
CREATE INDEX "configurations_currencyId_timezoneId_createdAt_updatedAt_idx" ON "public"."configurations"("currencyId", "timezoneId", "createdAt", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."configurations" ADD CONSTRAINT "configurations_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."configurations" ADD CONSTRAINT "configurations_timezoneId_fkey" FOREIGN KEY ("timezoneId") REFERENCES "public"."timezones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
