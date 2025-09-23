/*
  Warnings:

  - You are about to drop the column `appliedAt` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `appliedBy` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `authorizedBy` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `discounts` table. All the data in the column will be lost.
  - Added the required column `discountTypeId` to the `discounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."discounts" DROP CONSTRAINT "discounts_appliedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."discounts" DROP CONSTRAINT "discounts_customerId_fkey";

-- DropIndex
DROP INDEX "public"."discounts_discountType_idx";

-- DropIndex
DROP INDEX "public"."discounts_isActive_idx";

-- AlterTable
ALTER TABLE "public"."discounts" DROP COLUMN "appliedAt",
DROP COLUMN "appliedBy",
DROP COLUMN "authorizedBy",
DROP COLUMN "discountType",
DROP COLUMN "isActive",
DROP COLUMN "reason",
ADD COLUMN     "appliesToWholeDebt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "discountTypeId" INTEGER NOT NULL,
ADD COLUMN     "moratoryId" INTEGER,
ADD COLUMN     "percentage" DOUBLE PRECISION,
ALTER COLUMN "customerId" DROP NOT NULL,
ALTER COLUMN "amount" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."discount_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "discount_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_types_name_key" ON "public"."discount_types"("name");

-- CreateIndex
CREATE INDEX "discounts_moratoryId_idx" ON "public"."discounts"("moratoryId");

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_moratoryId_fkey" FOREIGN KEY ("moratoryId") REFERENCES "public"."moratory_interests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_discountTypeId_fkey" FOREIGN KEY ("discountTypeId") REFERENCES "public"."discount_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
