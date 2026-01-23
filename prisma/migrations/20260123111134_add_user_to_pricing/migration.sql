-- AlterTable
ALTER TABLE "AgeBasedPricing" ADD COLUMN     "createdByUserId" INTEGER,
ADD COLUMN     "updatedByUserId" INTEGER;

-- AlterTable
ALTER TABLE "DynamicPricing" ADD COLUMN     "createdByUserId" INTEGER,
ADD COLUMN     "updatedByUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "AgeBasedPricing" ADD CONSTRAINT "AgeBasedPricing_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgeBasedPricing" ADD CONSTRAINT "AgeBasedPricing_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPricing" ADD CONSTRAINT "DynamicPricing_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPricing" ADD CONSTRAINT "DynamicPricing_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
