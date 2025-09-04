/*
  Warnings:

  - You are about to alter the column `documentNumber` on the `collectors` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `documentNumber` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."collectors" ALTER COLUMN "documentNumber" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "public"."customers" ALTER COLUMN "documentNumber" SET DATA TYPE INTEGER;
