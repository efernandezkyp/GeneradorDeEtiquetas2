-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "defaultOriginCompany" TEXT NOT NULL DEFAULT '',
    "defaultDestinationCompany" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_companies" ("active", "code", "createdAt", "id", "name", "updatedAt") SELECT "active", "code", "createdAt", "id", "name", "updatedAt" FROM "companies";
DROP TABLE "companies";
ALTER TABLE "new_companies" RENAME TO "companies";
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
