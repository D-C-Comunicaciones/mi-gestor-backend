/*
  Warnings:

  - Added the required column `updatedAt` to the `moratory_interests` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."moratory_interests_installmentId_moratoryInterestStatusId_d_idx";

-- AlterTable
ALTER TABLE "public"."moratory_interests" ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "moratory_interests_installmentId_moratoryInterestStatusId_d_idx" ON "public"."moratory_interests"("installmentId", "moratoryInterestStatusId", "daysLate", "amount", "paidAt", "paidAmount", "isPaid", "createdAt", "updatedAt");
