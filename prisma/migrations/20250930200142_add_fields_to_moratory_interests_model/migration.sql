-- DropIndex
DROP INDEX "public"."moratory_interests_installmentId_daysLate_amount_idx";

-- AlterTable
ALTER TABLE "public"."moratory_interests" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moratoryInterestStatusId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paidAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" DATE;

-- CreateTable
CREATE TABLE "public"."moratory_interest_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "moratory_interest_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moratory_interest_statuses_name_key" ON "public"."moratory_interest_statuses"("name");

-- CreateIndex
CREATE INDEX "moratory_interest_statuses_id_name_idx" ON "public"."moratory_interest_statuses"("id", "name");

-- CreateIndex
CREATE INDEX "moratory_interests_installmentId_moratoryInterestStatusId_d_idx" ON "public"."moratory_interests"("installmentId", "moratoryInterestStatusId", "daysLate", "amount", "paidAt", "paidAmount", "isPaid");

-- AddForeignKey
ALTER TABLE "public"."moratory_interests" ADD CONSTRAINT "moratory_interests_moratoryInterestStatusId_fkey" FOREIGN KEY ("moratoryInterestStatusId") REFERENCES "public"."moratory_interest_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
