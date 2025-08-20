/*
  Warnings:

  - You are about to drop the `Loan_statuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Loan_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Loans` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Loans" DROP CONSTRAINT "Loans_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Loans" DROP CONSTRAINT "Loans_loanStatusId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Loans" DROP CONSTRAINT "Loans_loanTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Loans" DROP CONSTRAINT "Loans_paymentFrequencyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."installments" DROP CONSTRAINT "installments_loanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_loanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refinancings" DROP CONSTRAINT "refinancings_newLoanId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refinancings" DROP CONSTRAINT "refinancings_originalLoanId_fkey";

-- DropTable
DROP TABLE "public"."Loan_statuses";

-- DropTable
DROP TABLE "public"."Loan_types";

-- DropTable
DROP TABLE "public"."Loans";

-- CreateTable
CREATE TABLE "public"."loan_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loan_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loan_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "loan_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loans" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "principal" DECIMAL(12,2) NOT NULL,
    "remainingBalance" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(6,4) NOT NULL,
    "paymentAmount" DECIMAL(12,2),
    "term" INTEGER,
    "paymentFrequencyId" INTEGER NOT NULL,
    "loanTypeId" INTEGER NOT NULL,
    "loanStatusId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_types_name_key" ON "public"."loan_types"("name");

-- CreateIndex
CREATE INDEX "loan_types_name_idx" ON "public"."loan_types"("name");

-- CreateIndex
CREATE INDEX "loan_types_isActive_idx" ON "public"."loan_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "loan_statuses_name_key" ON "public"."loan_statuses"("name");

-- CreateIndex
CREATE INDEX "loan_statuses_name_idx" ON "public"."loan_statuses"("name");

-- CreateIndex
CREATE INDEX "loan_statuses_isActive_idx" ON "public"."loan_statuses"("isActive");

-- CreateIndex
CREATE INDEX "loans_customerId_idx" ON "public"."loans"("customerId");

-- CreateIndex
CREATE INDEX "loans_paymentFrequencyId_idx" ON "public"."loans"("paymentFrequencyId");

-- CreateIndex
CREATE INDEX "loans_loanTypeId_idx" ON "public"."loans"("loanTypeId");

-- CreateIndex
CREATE INDEX "loans_loanStatusId_idx" ON "public"."loans"("loanStatusId");

-- CreateIndex
CREATE INDEX "loans_isActive_idx" ON "public"."loans"("isActive");

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_paymentFrequencyId_fkey" FOREIGN KEY ("paymentFrequencyId") REFERENCES "public"."payment_frequencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "public"."loan_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_loanStatusId_fkey" FOREIGN KEY ("loanStatusId") REFERENCES "public"."loan_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."installments" ADD CONSTRAINT "installments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refinancings" ADD CONSTRAINT "refinancings_originalLoanId_fkey" FOREIGN KEY ("originalLoanId") REFERENCES "public"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refinancings" ADD CONSTRAINT "refinancings_newLoanId_fkey" FOREIGN KEY ("newLoanId") REFERENCES "public"."loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
