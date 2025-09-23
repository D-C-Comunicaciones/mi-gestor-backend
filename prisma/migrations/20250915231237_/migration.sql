/*
  Warnings:

  - You are about to drop the column `customerId` on the `positive_balances` table. All the data in the column will be lost.
  - Made the column `loanId` on table `positive_balances` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."positive_balances" DROP CONSTRAINT "positive_balances_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."positive_balances" DROP CONSTRAINT "positive_balances_loanId_fkey";

-- DropIndex
DROP INDEX "public"."positive_balances_customerId_idx";

-- AlterTable
ALTER TABLE "public"."positive_balances" DROP COLUMN "customerId",
ALTER COLUMN "loanId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."positive_balances" ADD CONSTRAINT "positive_balances_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
