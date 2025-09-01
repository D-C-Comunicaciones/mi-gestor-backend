/*
  Warnings:

  - You are about to drop the column `installmentId` on the `moratory_interests` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[loanId]` on the table `moratory_interests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `loanId` to the `moratory_interests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."moratory_interests" DROP CONSTRAINT "moratory_interests_installmentId_fkey";

-- DropIndex
DROP INDEX "public"."moratory_interests_installmentId_daysLate_amount_idx";

-- DropIndex
DROP INDEX "public"."moratory_interests_installmentId_key";

-- AlterTable
ALTER TABLE "public"."moratory_interests" DROP COLUMN "installmentId",
ADD COLUMN     "loanId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "moratory_interests_loanId_key" ON "public"."moratory_interests"("loanId");

-- CreateIndex
CREATE INDEX "moratory_interests_loanId_daysLate_amount_idx" ON "public"."moratory_interests"("loanId", "daysLate", "amount");

-- AddForeignKey
ALTER TABLE "public"."moratory_interests" ADD CONSTRAINT "moratory_interests_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
