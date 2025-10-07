/*
  Warnings:

  - You are about to drop the column `percentageId` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `appliedToCapital` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `appliedToInterest` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `appliedToLateFee` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `percentage_discounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."discounts" DROP CONSTRAINT "discounts_percentageId_fkey";

-- AlterTable
ALTER TABLE "public"."discounts" DROP COLUMN "percentageId",
ALTER COLUMN "createdAt" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "public"."moratory_interests" ADD COLUMN     "isDiscounted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "appliedToCapital",
DROP COLUMN "appliedToInterest",
DROP COLUMN "appliedToLateFee";

-- DropTable
DROP TABLE "public"."percentage_discounts";
