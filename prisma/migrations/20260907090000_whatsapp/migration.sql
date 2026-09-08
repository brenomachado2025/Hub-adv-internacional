-- AlterTable
ALTER TABLE "CrmClient" ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "WhatsappSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "qrCode" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "lastConnectedAt" TIMESTAMP(3),
    "lastError" TEXT NOT NULL DEFAULT '',
    "authState" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crmClientId" TEXT,
    "phone" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "crmClientId" TEXT,
    "step" TEXT NOT NULL DEFAULT 'MENU',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappCommand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappErrorLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappStatusNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WhatsappStatusNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappSession_userId_key" ON "WhatsappSession"("userId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_userId_idx" ON "WhatsappMessage"("userId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_crmClientId_idx" ON "WhatsappMessage"("crmClientId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_userId_status_idx" ON "WhatsappMessage"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappConversationState_userId_phone_key" ON "WhatsappConversationState"("userId", "phone");

-- CreateIndex
CREATE INDEX "WhatsappCommand_userId_status_idx" ON "WhatsappCommand"("userId", "status");

-- CreateIndex
CREATE INDEX "WhatsappErrorLog_userId_idx" ON "WhatsappErrorLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappStatusNotification_userId_status_key" ON "WhatsappStatusNotification"("userId", "status");

-- CreateIndex
CREATE INDEX "CrmClient_userId_phone_idx" ON "CrmClient"("userId", "phone");

-- AddForeignKey
ALTER TABLE "WhatsappSession" ADD CONSTRAINT "WhatsappSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_crmClientId_fkey" FOREIGN KEY ("crmClientId") REFERENCES "CrmClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappStatusNotification" ADD CONSTRAINT "WhatsappStatusNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
