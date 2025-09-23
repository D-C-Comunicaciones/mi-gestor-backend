/*
  Warnings:

  - You are about to drop the column `appliedToCapital` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `appliedToInterest` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `appliedToLateFee` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "appliedToCapital",
DROP COLUMN "appliedToInterest",
DROP COLUMN "appliedToLateFee";
