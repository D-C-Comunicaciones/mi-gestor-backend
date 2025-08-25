/*
  Warnings:

  - Added the required column `gracePeriod` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."loans" ADD COLUMN     "gracePeriod" INTEGER NOT NULL,
ADD COLUMN     "penaltyRateId" INTEGER;

-- CreateTable
CREATE TABLE "public"."penalty_rates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(5,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "penalty_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MoratoryInterest" (
    "id" SERIAL NOT NULL,
    "installmentId" INTEGER NOT NULL,
    "daysLate" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoratoryInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MoratoryInterest_installmentId_key" ON "public"."MoratoryInterest"("installmentId");

-- CreateIndex
CREATE INDEX "loans_penaltyRateId_idx" ON "public"."loans"("penaltyRateId");

-- AddForeignKey
ALTER TABLE "public"."MoratoryInterest" ADD CONSTRAINT "MoratoryInterest_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_penaltyRateId_fkey" FOREIGN KEY ("penaltyRateId") REFERENCES "public"."penalty_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
