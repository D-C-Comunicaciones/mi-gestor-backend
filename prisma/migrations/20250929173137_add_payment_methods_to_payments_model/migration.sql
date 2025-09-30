/*
  Warnings:

  - Added the required column `paymentMethodId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "paymentMethodId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "public"."payment_methods"("name");

-- CreateIndex
CREATE INDEX "payment_methods_name_idx" ON "public"."payment_methods"("name");

-- CreateIndex
CREATE INDEX "payment_methods_isActive_idx" ON "public"."payment_methods"("isActive");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
