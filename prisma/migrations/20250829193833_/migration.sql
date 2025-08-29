/*
  Warnings:

  - You are about to drop the column `customerId` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `discounts` table. All the data in the column will be lost.
  - You are about to drop the column `paymentAmount` on the `loans` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."discounts" DROP CONSTRAINT "discounts_customerId_fkey";

-- DropIndex
DROP INDEX "public"."discounts_customerId_idx";

-- AlterTable
ALTER TABLE "public"."discounts" DROP COLUMN "customerId",
DROP COLUMN "percentage",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "percentageId" INTEGER;

-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "paymentAmount";

-- CreateTable
CREATE TABLE "public"."percentage_discounts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "percentage_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "percentage_discounts_name_key" ON "public"."percentage_discounts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "percentage_discounts_value_key" ON "public"."percentage_discounts"("value");

-- CreateIndex
CREATE INDEX "percentage_discounts_id_value_name_idx" ON "public"."percentage_discounts"("id", "value", "name");

-- AddForeignKey
ALTER TABLE "public"."discounts" ADD CONSTRAINT "discounts_percentageId_fkey" FOREIGN KEY ("percentageId") REFERENCES "public"."percentage_discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
