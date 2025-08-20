/*
  Warnings:

  - You are about to drop the column `interestRate` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `appliedToPrincipal` on the `payments` table. All the data in the column will be lost.
  - Added the required column `interestRateId` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "interestRate",
ADD COLUMN     "interestRateId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "appliedToPrincipal",
ADD COLUMN     "appliedToCapital" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE "public"."interest_rates" (
    "id" SERIAL NOT NULL,
    "value" DECIMAL(6,4) NOT NULL,

    CONSTRAINT "interest_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interest_rates_value_idx" ON "public"."interest_rates"("value");

-- CreateIndex
CREATE INDEX "loans_interestRateId_idx" ON "public"."loans"("interestRateId");

-- CreateIndex
CREATE INDEX "loans_startDate_idx" ON "public"."loans"("startDate");

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_interestRateId_fkey" FOREIGN KEY ("interestRateId") REFERENCES "public"."interest_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
