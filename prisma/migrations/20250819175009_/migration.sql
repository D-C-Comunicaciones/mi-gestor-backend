/*
  Warnings:

  - You are about to drop the column `creditId` on the `installments` table. All the data in the column will be lost.
  - You are about to drop the column `creditId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `newCreditId` on the `refinancings` table. All the data in the column will be lost.
  - You are about to drop the column `originalCreditId` on the `refinancings` table. All the data in the column will be lost.
  - You are about to drop the `credit_statuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `credit_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `credits` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `loanId` to the `installments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loanId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalLoanId` to the `refinancings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."credits" DROP CONSTRAINT "credits_creditStatusId_fkey";

-- DropForeignKey
ALTER TABLE "public"."credits" DROP CONSTRAINT "credits_creditTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."credits" DROP CONSTRAINT "credits_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."credits" DROP CONSTRAINT "credits_paymentFrequencyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."installments" DROP CONSTRAINT "installments_creditId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_creditId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refinancings" DROP CONSTRAINT "refinancings_newCreditId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refinancings" DROP CONSTRAINT "refinancings_originalCreditId_fkey";

-- DropIndex
DROP INDEX "public"."installments_creditId_idx";

-- DropIndex
DROP INDEX "public"."payments_creditId_idx";

-- DropIndex
DROP INDEX "public"."refinancings_newCreditId_idx";

-- DropIndex
DROP INDEX "public"."refinancings_originalCreditId_idx";

-- AlterTable
ALTER TABLE "public"."installments" DROP COLUMN "creditId",
ADD COLUMN     "loanId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "creditId",
ADD COLUMN     "loanId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."refinancings" DROP COLUMN "newCreditId",
DROP COLUMN "originalCreditId",
ADD COLUMN     "newLoanId" INTEGER,
ADD COLUMN     "originalLoanId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."credit_statuses";

-- DropTable
DROP TABLE "public"."credit_types";

-- DropTable
DROP TABLE "public"."credits";

-- CreateTable
CREATE TABLE "public"."Loan_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Loan_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loan_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Loan_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Loans" (
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

    CONSTRAINT "Loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Loan_types_name_key" ON "public"."Loan_types"("name");

-- CreateIndex
CREATE INDEX "Loan_types_name_idx" ON "public"."Loan_types"("name");

-- CreateIndex
CREATE INDEX "Loan_types_isActive_idx" ON "public"."Loan_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_statuses_name_key" ON "public"."Loan_statuses"("name");

-- CreateIndex
CREATE INDEX "Loan_statuses_name_idx" ON "public"."Loan_statuses"("name");

-- CreateIndex
CREATE INDEX "Loan_statuses_isActive_idx" ON "public"."Loan_statuses"("isActive");

-- CreateIndex
CREATE INDEX "Loans_customerId_idx" ON "public"."Loans"("customerId");

-- CreateIndex
CREATE INDEX "Loans_paymentFrequencyId_idx" ON "public"."Loans"("paymentFrequencyId");

-- CreateIndex
CREATE INDEX "Loans_loanTypeId_idx" ON "public"."Loans"("loanTypeId");

-- CreateIndex
CREATE INDEX "Loans_loanStatusId_idx" ON "public"."Loans"("loanStatusId");

-- CreateIndex
CREATE INDEX "Loans_isActive_idx" ON "public"."Loans"("isActive");

-- CreateIndex
CREATE INDEX "installments_loanId_idx" ON "public"."installments"("loanId");

-- CreateIndex
CREATE INDEX "payments_loanId_idx" ON "public"."payments"("loanId");

-- CreateIndex
CREATE INDEX "refinancings_originalLoanId_idx" ON "public"."refinancings"("originalLoanId");

-- CreateIndex
CREATE INDEX "refinancings_newLoanId_idx" ON "public"."refinancings"("newLoanId");

-- AddForeignKey
ALTER TABLE "public"."Loans" ADD CONSTRAINT "Loans_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loans" ADD CONSTRAINT "Loans_paymentFrequencyId_fkey" FOREIGN KEY ("paymentFrequencyId") REFERENCES "public"."payment_frequencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loans" ADD CONSTRAINT "Loans_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "public"."Loan_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Loans" ADD CONSTRAINT "Loans_loanStatusId_fkey" FOREIGN KEY ("loanStatusId") REFERENCES "public"."Loan_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."installments" ADD CONSTRAINT "installments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."Loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refinancings" ADD CONSTRAINT "refinancings_originalLoanId_fkey" FOREIGN KEY ("originalLoanId") REFERENCES "public"."Loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refinancings" ADD CONSTRAINT "refinancings_newLoanId_fkey" FOREIGN KEY ("newLoanId") REFERENCES "public"."Loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
