/*
  Warnings:

  - You are about to drop the column `loanId` on the `moratory_interests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[InstallmentId]` on the table `moratory_interests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `InstallmentId` to the `moratory_interests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."moratory_interests" DROP CONSTRAINT "moratory_interests_loanId_fkey";

-- DropIndex
DROP INDEX "public"."moratory_interests_loanId_daysLate_amount_idx";

-- DropIndex
DROP INDEX "public"."moratory_interests_loanId_key";

-- AlterTable
ALTER TABLE "public"."moratory_interests" DROP COLUMN "loanId",
ADD COLUMN     "InstallmentId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "moratory_interests_InstallmentId_key" ON "public"."moratory_interests"("InstallmentId");

-- CreateIndex
CREATE INDEX "moratory_interests_InstallmentId_daysLate_amount_idx" ON "public"."moratory_interests"("InstallmentId", "daysLate", "amount");

-- AddForeignKey
ALTER TABLE "public"."moratory_interests" ADD CONSTRAINT "moratory_interests_InstallmentId_fkey" FOREIGN KEY ("InstallmentId") REFERENCES "public"."installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
