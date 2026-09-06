-- AlterTable
ALTER TABLE "FeeCalculation" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "userId" SET NOT NULL;
