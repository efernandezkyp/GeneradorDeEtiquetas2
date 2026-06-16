-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_labels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "externalReference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "productsJson" TEXT NOT NULL DEFAULT '[]',
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "originCompany" TEXT NOT NULL,
    "destinationCompany" TEXT NOT NULL,
    "zplContent" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "labels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "labels_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_labels" ("address", "companyId", "createdAt", "createdBy", "destinationCompany", "externalReference", "id", "originCompany", "phone", "productDescription", "reason", "receiver", "updatedAt", "zplContent") SELECT "address", "companyId", "createdAt", "createdBy", "destinationCompany", "externalReference", "id", "originCompany", "phone", "productDescription", "reason", "receiver", "updatedAt", "zplContent" FROM "labels";
DROP TABLE "labels";
ALTER TABLE "new_labels" RENAME TO "labels";
CREATE INDEX "labels_companyId_idx" ON "labels"("companyId");
CREATE INDEX "labels_externalReference_idx" ON "labels"("externalReference");
CREATE INDEX "labels_createdBy_idx" ON "labels"("createdBy");
CREATE INDEX "labels_createdAt_idx" ON "labels"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
