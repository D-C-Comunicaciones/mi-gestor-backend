-- AlterTable
ALTER TABLE "public"."installments" ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."StatusInstallment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "StatusInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StatusInstallment_name_key" ON "public"."StatusInstallment"("name");

-- AddForeignKey
ALTER TABLE "public"."installments" ADD CONSTRAINT "installments_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."StatusInstallment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
