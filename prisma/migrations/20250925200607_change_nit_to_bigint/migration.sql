-- AlterTable
ALTER TABLE "public"."companies" ADD COLUMN     "verificationDigit" INTEGER,
ALTER COLUMN "nit" SET DATA TYPE BIGINT;
