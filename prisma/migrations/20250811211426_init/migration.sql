-- CreateTable
CREATE TABLE "public"."zones" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."type_document_identifications" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "type_document_identifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."genders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "genders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "credit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_frequencies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_frequencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_statuses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "credit_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "public"."logins" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL DEFAULT 'unknown',
    "ip" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."changes" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "typeDocumentId" INTEGER NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "genderId" INTEGER NOT NULL,
    "userId" INTEGER,
    "zoneId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collectors" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "zoneId" INTEGER,
    "userId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "collectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credits" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "principal" DECIMAL(12,2) NOT NULL,
    "remainingBalance" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(6,4) NOT NULL,
    "paymentAmount" DECIMAL(12,2),
    "term" INTEGER,
    "paymentFrequencyId" INTEGER NOT NULL,
    "creditTypeId" INTEGER NOT NULL,
    "creditStatusId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."installments" (
    "id" SERIAL NOT NULL,
    "creditId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "interestAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" SERIAL NOT NULL,
    "creditId" INTEGER NOT NULL,
    "installmentId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentTypeId" INTEGER NOT NULL,
    "collectorId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedToPrincipal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "appliedToInterest" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "appliedToLateFee" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "recordedByUserId" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refinancings" (
    "id" SERIAL NOT NULL,
    "originalCreditId" INTEGER NOT NULL,
    "newCreditId" INTEGER,
    "oldPrincipal" DECIMAL(12,2) NOT NULL,
    "oldRemaining" DECIMAL(12,2) NOT NULL,
    "newPrincipal" DECIMAL(12,2) NOT NULL,
    "newRemaining" DECIMAL(12,2) NOT NULL,
    "oldInterestRate" DECIMAL(6,4) NOT NULL,
    "newInterestRate" DECIMAL(6,4) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "refinancings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "public"."zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "zones_code_key" ON "public"."zones"("code");

-- CreateIndex
CREATE INDEX "zones_name_idx" ON "public"."zones"("name");

-- CreateIndex
CREATE INDEX "zones_code_idx" ON "public"."zones"("code");

-- CreateIndex
CREATE INDEX "zones_isActive_idx" ON "public"."zones"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "type_document_identifications_name_key" ON "public"."type_document_identifications"("name");

-- CreateIndex
CREATE UNIQUE INDEX "type_document_identifications_code_key" ON "public"."type_document_identifications"("code");

-- CreateIndex
CREATE INDEX "type_document_identifications_name_idx" ON "public"."type_document_identifications"("name");

-- CreateIndex
CREATE INDEX "type_document_identifications_code_idx" ON "public"."type_document_identifications"("code");

-- CreateIndex
CREATE INDEX "type_document_identifications_isActive_idx" ON "public"."type_document_identifications"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "genders_name_key" ON "public"."genders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genders_code_key" ON "public"."genders"("code");

-- CreateIndex
CREATE INDEX "genders_name_idx" ON "public"."genders"("name");

-- CreateIndex
CREATE INDEX "genders_code_idx" ON "public"."genders"("code");

-- CreateIndex
CREATE INDEX "genders_isActive_idx" ON "public"."genders"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "credit_types_name_key" ON "public"."credit_types"("name");

-- CreateIndex
CREATE INDEX "credit_types_name_idx" ON "public"."credit_types"("name");

-- CreateIndex
CREATE INDEX "credit_types_isActive_idx" ON "public"."credit_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "payment_frequencies_name_key" ON "public"."payment_frequencies"("name");

-- CreateIndex
CREATE INDEX "payment_frequencies_name_idx" ON "public"."payment_frequencies"("name");

-- CreateIndex
CREATE INDEX "payment_frequencies_isActive_idx" ON "public"."payment_frequencies"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "credit_statuses_name_key" ON "public"."credit_statuses"("name");

-- CreateIndex
CREATE INDEX "credit_statuses_name_idx" ON "public"."credit_statuses"("name");

-- CreateIndex
CREATE INDEX "credit_statuses_isActive_idx" ON "public"."credit_statuses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "payment_types_name_key" ON "public"."payment_types"("name");

-- CreateIndex
CREATE INDEX "payment_types_name_idx" ON "public"."payment_types"("name");

-- CreateIndex
CREATE INDEX "payment_types_isActive_idx" ON "public"."payment_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "public"."users"("roleId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "public"."roles"("name");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "public"."roles"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_name_idx" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "public"."permissions"("isActive");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "public"."role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "public"."role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "role_permissions_isActive_idx" ON "public"."role_permissions"("isActive");

-- CreateIndex
CREATE INDEX "logins_userId_idx" ON "public"."logins"("userId");

-- CreateIndex
CREATE INDEX "logins_timestamp_idx" ON "public"."logins"("timestamp");

-- CreateIndex
CREATE INDEX "logins_sessionId_idx" ON "public"."logins"("sessionId");

-- CreateIndex
CREATE INDEX "changes_model_idx" ON "public"."changes"("model");

-- CreateIndex
CREATE INDEX "changes_action_idx" ON "public"."changes"("action");

-- CreateIndex
CREATE INDEX "changes_userId_idx" ON "public"."changes"("userId");

-- CreateIndex
CREATE INDEX "changes_timestamp_idx" ON "public"."changes"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "customers_documentNumber_key" ON "public"."customers"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customers_userId_key" ON "public"."customers"("userId");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "public"."customers"("name");

-- CreateIndex
CREATE INDEX "customers_typeDocumentId_idx" ON "public"."customers"("typeDocumentId");

-- CreateIndex
CREATE INDEX "customers_documentNumber_idx" ON "public"."customers"("documentNumber");

-- CreateIndex
CREATE INDEX "customers_zoneId_idx" ON "public"."customers"("zoneId");

-- CreateIndex
CREATE INDEX "customers_isActive_idx" ON "public"."customers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "collectors_userId_key" ON "public"."collectors"("userId");

-- CreateIndex
CREATE INDEX "collectors_firstName_idx" ON "public"."collectors"("firstName");

-- CreateIndex
CREATE INDEX "collectors_lastName_idx" ON "public"."collectors"("lastName");

-- CreateIndex
CREATE INDEX "collectors_zoneId_idx" ON "public"."collectors"("zoneId");

-- CreateIndex
CREATE INDEX "collectors_isActive_idx" ON "public"."collectors"("isActive");

-- CreateIndex
CREATE INDEX "credits_customerId_idx" ON "public"."credits"("customerId");

-- CreateIndex
CREATE INDEX "credits_paymentFrequencyId_idx" ON "public"."credits"("paymentFrequencyId");

-- CreateIndex
CREATE INDEX "credits_creditTypeId_idx" ON "public"."credits"("creditTypeId");

-- CreateIndex
CREATE INDEX "credits_creditStatusId_idx" ON "public"."credits"("creditStatusId");

-- CreateIndex
CREATE INDEX "credits_isActive_idx" ON "public"."credits"("isActive");

-- CreateIndex
CREATE INDEX "installments_creditId_idx" ON "public"."installments"("creditId");

-- CreateIndex
CREATE INDEX "installments_dueDate_idx" ON "public"."installments"("dueDate");

-- CreateIndex
CREATE INDEX "installments_isPaid_idx" ON "public"."installments"("isPaid");

-- CreateIndex
CREATE INDEX "payments_creditId_idx" ON "public"."payments"("creditId");

-- CreateIndex
CREATE INDEX "payments_installmentId_idx" ON "public"."payments"("installmentId");

-- CreateIndex
CREATE INDEX "payments_paymentTypeId_idx" ON "public"."payments"("paymentTypeId");

-- CreateIndex
CREATE INDEX "payments_collectorId_idx" ON "public"."payments"("collectorId");

-- CreateIndex
CREATE INDEX "refinancings_originalCreditId_idx" ON "public"."refinancings"("originalCreditId");

-- CreateIndex
CREATE INDEX "refinancings_newCreditId_idx" ON "public"."refinancings"("newCreditId");

-- CreateIndex
CREATE INDEX "refinancings_date_idx" ON "public"."refinancings"("date");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."logins" ADD CONSTRAINT "logins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_typeDocumentId_fkey" FOREIGN KEY ("typeDocumentId") REFERENCES "public"."type_document_identifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "public"."genders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collectors" ADD CONSTRAINT "collectors_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collectors" ADD CONSTRAINT "collectors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credits" ADD CONSTRAINT "credits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credits" ADD CONSTRAINT "credits_paymentFrequencyId_fkey" FOREIGN KEY ("paymentFrequencyId") REFERENCES "public"."payment_frequencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credits" ADD CONSTRAINT "credits_creditTypeId_fkey" FOREIGN KEY ("creditTypeId") REFERENCES "public"."credit_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credits" ADD CONSTRAINT "credits_creditStatusId_fkey" FOREIGN KEY ("creditStatusId") REFERENCES "public"."credit_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."installments" ADD CONSTRAINT "installments_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "public"."credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "public"."credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "public"."installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "public"."payment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refinancings" ADD CONSTRAINT "refinancings_originalCreditId_fkey" FOREIGN KEY ("originalCreditId") REFERENCES "public"."credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refinancings" ADD CONSTRAINT "refinancings_newCreditId_fkey" FOREIGN KEY ("newCreditId") REFERENCES "public"."credits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
