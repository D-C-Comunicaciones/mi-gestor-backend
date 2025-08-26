-- DropForeignKey
ALTER TABLE "public"."loans" DROP CONSTRAINT "loans_termId_fkey";

-- AlterTable
ALTER TABLE "public"."loans" ALTER COLUMN "termId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
