/*
  Warnings:

  - You are about to alter the column `interestAmount` on the `installments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `totalAmount` on the `installments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `paidAmount` on the `installments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `capitalAmount` on the `installments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `remainingBalance` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `paymentAmount` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `loanAmount` on the `loans` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `appliedToInterest` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `appliedToLateFee` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `appliedToCapital` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `oldPrincipal` on the `refinancings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `oldRemaining` on the `refinancings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `newPrincipal` on the `refinancings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.
  - You are about to alter the column `newRemaining` on the `refinancings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,0)`.

*/
-- AlterTable
ALTER TABLE "public"."installments" ALTER COLUMN "interestAmount" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "paidAmount" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "capitalAmount" SET DATA TYPE DECIMAL(10,0);

-- AlterTable
ALTER TABLE "public"."loans" ALTER COLUMN "remainingBalance" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "paymentAmount" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "loanAmount" SET DATA TYPE DECIMAL(10,0);

-- AlterTable
ALTER TABLE "public"."payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "appliedToInterest" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "appliedToLateFee" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "appliedToCapital" SET DATA TYPE DECIMAL(10,0);

-- AlterTable
ALTER TABLE "public"."refinancings" ALTER COLUMN "oldPrincipal" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "oldRemaining" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "newPrincipal" SET DATA TYPE DECIMAL(10,0),
ALTER COLUMN "newRemaining" SET DATA TYPE DECIMAL(10,0);
