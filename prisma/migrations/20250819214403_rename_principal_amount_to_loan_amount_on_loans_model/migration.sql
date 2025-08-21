/*
  Warnings:

  - You are about to drop the column `principalAmount` on the `installments` table. All the data in the column will be lost.
  - You are about to drop the column `principal` on the `loans` table. All the data in the column will be lost.
  - Added the required column `capitalAmount` to the `installments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loanAmount` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."installments" DROP COLUMN "principalAmount",
ADD COLUMN     "capitalAmount" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "principal",
ADD COLUMN     "loanAmount" DECIMAL(12,2) NOT NULL;
