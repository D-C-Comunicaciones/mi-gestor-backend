-- AlterTable
ALTER TABLE "public"."loans" ADD COLUMN     "graceEndDate" DATE,
ADD COLUMN     "requiresCapitalPayment" BOOLEAN NOT NULL DEFAULT false;
