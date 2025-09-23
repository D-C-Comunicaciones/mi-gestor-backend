/*
  Warnings:

  - You are about to drop the column `installmentId` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_installmentId_fkey";

-- DropIndex
DROP INDEX "public"."payments_installmentId_idx";

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "installmentId";

-- CreateTable
CREATE TABLE "public"."payment_allocations" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "installmentId" INTEGER NOT NULL,
    "appliedToCapital" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "appliedToInterest" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "appliedToLateFee" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."positive_balances" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "loanId" INTEGER,
    "amount" DECIMAL(20,2) NOT NULL,
    "source" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positive_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."advances" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "loanId" INTEGER NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "appliedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(20,2) NOT NULL,
    "collectorId" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discounts" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "loanId" INTEGER,
    "installmentId" INTEGER,
    "discountType" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "authorizedBy" TEXT NOT NULL,
    "appliedBy" INTEGER,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_allocations_paymentId_idx" ON "public"."payment_allocations"("paymentId");

-- CreateIndex
CREATE INDEX "payment_allocations_installmentId_idx" ON "public"."payment_allocations"("installmentId");

-- CreateIndex
CREATE INDEX "positive_balances_customerId_idx" ON "public"."positive_balances"("customerId");

-- CreateIndex
CREATE INDEX "positive_balances_loanId_idx" ON "public"."positive_balances"("loanId");

-- CreateIndex
CREATE INDEX "positive_balances_isUsed_idx" ON "public"."positive_balances"("isUsed");

-- CreateIndex
CREATE INDEX "advances_customerId_idx" ON "public"."advances"("customerId");

-- CreateIndex
CREATE INDEX "advances_loanId_idx" ON "public"."advances"("loanId");

-- CreateIndex
CREATE INDEX "advances_collectorId_idx" ON "public"."advances"("collectorId");

-- CreateIndex
CREATE INDEX "advances_isActive_idx" ON "public"."advances"("isActive");

-- CreateIndex
CREATE INDEX "discounts_customerId_idx" ON "public"."discounts"("customerId");

-- CreateIndex
CREATE INDEX "discounts_loanId_idx" ON "public"."discounts"("loanId");

-- CreateIndex
CREATE INDEX "discounts_installmentId_idx" ON "public"."discounts"("installmentId");

-- CreateIndex
CREATE INDEX "discounts_discountType_idx" ON "public"."discounts"("discountType");

-- CreateIndex
CREATE INDEX "discounts_isActive_idx" ON "public"."discounts"("isActive");

-- AddForeignKey
ALTER TABLE "public"."payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_allocations" ADD CONSTRAINT "payment_allocations_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."positive_balances" ADD CONSTRAINT "positive_balances_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."positive_balances" ADD CONSTRAINT "positive_balances_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."advances" ADD CONSTRAINT "advances_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."advances" ADD CONSTRAINT "advances_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."advances" ADD CONSTRAINT "advances_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
