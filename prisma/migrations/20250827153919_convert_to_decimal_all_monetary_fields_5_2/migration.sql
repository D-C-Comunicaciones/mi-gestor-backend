/*
  Warnings:

  - You are about to alter the column `value` on the `interest_rates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(20,2)`.
  - You are about to alter the column `value` on the `penalty_rates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,4)` to `Decimal(20,2)`.
  - You are about to alter the column `oldInterestRate` on the `refinancings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(20,2)`.
  - You are about to alter the column `newInterestRate` on the `refinancings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(6,4)` to `Decimal(20,2)`.

*/
-- AlterTable
ALTER TABLE "public"."installments" ALTER COLUMN "interestAmount" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "capitalAmount" SET DATA TYPE DECIMAL(20,2);

-- AlterTable
ALTER TABLE "public"."interest_rates" ALTER COLUMN "value" SET DATA TYPE DECIMAL(20,2);

-- AlterTable
ALTER TABLE "public"."loans" ALTER COLUMN "remainingBalance" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "paymentAmount" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "loanAmount" SET DATA TYPE DECIMAL(20,2);

-- AlterTable
ALTER TABLE "public"."payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "appliedToInterest" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "appliedToLateFee" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "appliedToCapital" SET DATA TYPE DECIMAL(20,2);

-- AlterTable
ALTER TABLE "public"."penalty_rates" ALTER COLUMN "value" SET DATA TYPE DECIMAL(20,2);

-- AlterTable
ALTER TABLE "public"."refinancings" ALTER COLUMN "oldPrincipal" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "oldRemaining" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "newPrincipal" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "newRemaining" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "oldInterestRate" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "newInterestRate" SET DATA TYPE DECIMAL(20,2);
