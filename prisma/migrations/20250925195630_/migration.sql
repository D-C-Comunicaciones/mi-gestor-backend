/*
  Warnings:

  - You are about to drop the column `Nit` on the `companies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nit]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nit` to the `companies` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."companies_Nit_key";

-- DropIndex
DROP INDEX "public"."companies_name_Nit_phone_email_createdAt_updatedAt_idx";

-- AlterTable
ALTER TABLE "public"."companies" DROP COLUMN "Nit",
ADD COLUMN     "nit" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "companies_nit_key" ON "public"."companies"("nit");

-- CreateIndex
CREATE INDEX "companies_name_nit_phone_email_createdAt_updatedAt_idx" ON "public"."companies"("name", "nit", "phone", "email", "createdAt", "updatedAt");
