-- CreateTable
CREATE TABLE "public"."positive_balance_allocations" (
    "id" SERIAL NOT NULL,
    "positiveBalanceId" INTEGER NOT NULL,
    "installmentId" INTEGER NOT NULL,
    "appliedToInterest" DECIMAL(20,2) NOT NULL,
    "appliedToCapital" DECIMAL(20,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positive_balance_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "positive_balance_allocations_positiveBalanceId_idx" ON "public"."positive_balance_allocations"("positiveBalanceId");

-- CreateIndex
CREATE INDEX "positive_balance_allocations_installmentId_idx" ON "public"."positive_balance_allocations"("installmentId");

-- AddForeignKey
ALTER TABLE "public"."positive_balance_allocations" ADD CONSTRAINT "positive_balance_allocations_positiveBalanceId_fkey" FOREIGN KEY ("positiveBalanceId") REFERENCES "public"."positive_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."positive_balance_allocations" ADD CONSTRAINT "positive_balance_allocations_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
