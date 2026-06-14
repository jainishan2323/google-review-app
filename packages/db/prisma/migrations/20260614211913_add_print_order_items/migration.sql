-- AlterTable
ALTER TABLE "PrintOrder" ALTER COLUMN "quantity" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "PrintOrderItem" (
    "id" TEXT NOT NULL,
    "printOrderId" TEXT NOT NULL,
    "hasNfc" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "PrintOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrintOrderItem_printOrderId_idx" ON "PrintOrderItem"("printOrderId");

-- AddForeignKey
ALTER TABLE "PrintOrderItem" ADD CONSTRAINT "PrintOrderItem_printOrderId_fkey" FOREIGN KEY ("printOrderId") REFERENCES "PrintOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
