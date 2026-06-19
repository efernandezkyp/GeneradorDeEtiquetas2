-- CreateEnum
CREATE TYPE "LabelStatus" AS ENUM ('PENDIENTE', 'DESPACHADA');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PICKER';

-- AlterTable
ALTER TABLE "labels" ADD COLUMN     "scannedAt" TIMESTAMP(3),
ADD COLUMN     "scannedBy" TEXT,
ADD COLUMN     "status" "LabelStatus" NOT NULL DEFAULT 'PENDIENTE';

-- CreateIndex
CREATE INDEX "labels_status_idx" ON "labels"("status");

-- CreateIndex
CREATE INDEX "labels_companyId_status_idx" ON "labels"("companyId", "status");
