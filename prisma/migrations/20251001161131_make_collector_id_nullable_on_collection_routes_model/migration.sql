-- DropForeignKey
ALTER TABLE "public"."CollectionRoute" DROP CONSTRAINT "CollectionRoute_collectorId_fkey";

-- AlterTable
ALTER TABLE "public"."CollectionRoute" ALTER COLUMN "collectorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."CollectionRoute" ADD CONSTRAINT "CollectionRoute_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
