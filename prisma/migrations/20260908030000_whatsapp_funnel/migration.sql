-- AlterTable
ALTER TABLE "WhatsappMessage" ADD COLUMN     "audioUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'BOT';

-- CreateTable
CREATE TABLE "WhatsappFunnelMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "WhatsappFunnelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappFunnelMessage_userId_key_key" ON "WhatsappFunnelMessage"("userId", "key");

-- AddForeignKey
ALTER TABLE "WhatsappFunnelMessage" ADD CONSTRAINT "WhatsappFunnelMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
