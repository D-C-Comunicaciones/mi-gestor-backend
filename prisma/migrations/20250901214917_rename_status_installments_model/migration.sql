/*
  Warnings:

  - You are about to drop the `StatusInstallment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."installments" DROP CONSTRAINT "installments_statusId_fkey";

-- DropTable
DROP TABLE "public"."StatusInstallment";

-- CreateTable
CREATE TABLE "public"."installment_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "installment_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "installment_statuses_name_key" ON "public"."installment_statuses"("name");

-- CreateIndex
CREATE INDEX "installment_statuses_name_description_idx" ON "public"."installment_statuses"("name", "description");

-- AddForeignKey
ALTER TABLE "public"."installments" ADD CONSTRAINT "installments_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."installment_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
