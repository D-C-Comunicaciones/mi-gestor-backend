/*
  Warnings:

  - You are about to drop the `MoratoryInterest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."MoratoryInterest" DROP CONSTRAINT "MoratoryInterest_installmentId_fkey";

-- DropTable
DROP TABLE "public"."MoratoryInterest";

-- CreateTable
CREATE TABLE "public"."moratory_interests" (
    "id" SERIAL NOT NULL,
    "installmentId" INTEGER NOT NULL,
    "daysLate" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "moratory_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moratory_interests_installmentId_key" ON "public"."moratory_interests"("installmentId");

-- CreateIndex
CREATE INDEX "moratory_interests_installmentId_daysLate_amount_idx" ON "public"."moratory_interests"("installmentId", "daysLate", "amount");

-- AddForeignKey
ALTER TABLE "public"."moratory_interests" ADD CONSTRAINT "moratory_interests_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
