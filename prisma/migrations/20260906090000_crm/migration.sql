-- CreateTable
CREATE TABLE "CrmClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'CPF',
    "documentNumber" TEXT NOT NULL DEFAULT '',
    "legalArea" TEXT NOT NULL DEFAULT 'Outro',
    "companyName" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'CONTACTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmStatusHistory" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmClient_userId_idx" ON "CrmClient"("userId");

-- CreateIndex
CREATE INDEX "CrmClient_userId_status_idx" ON "CrmClient"("userId", "status");

-- CreateIndex
CREATE INDEX "CrmStatusHistory_clientId_idx" ON "CrmStatusHistory"("clientId");

-- AddForeignKey
ALTER TABLE "CrmClient" ADD CONSTRAINT "CrmClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmStatusHistory" ADD CONSTRAINT "CrmStatusHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CrmClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
