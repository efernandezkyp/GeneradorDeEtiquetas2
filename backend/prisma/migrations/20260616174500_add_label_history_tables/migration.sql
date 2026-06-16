-- CreateTable
CREATE TABLE "label_history_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labelId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changesJson" TEXT NOT NULL DEFAULT '[]',
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "label_history_events_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_history_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "label_history_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "label_download_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labelId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "downloadType" TEXT NOT NULL,
    "metadataJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "label_download_events_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "label_download_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "label_download_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "label_history_events_labelId_idx" ON "label_history_events"("labelId");

-- CreateIndex
CREATE INDEX "label_history_events_companyId_idx" ON "label_history_events"("companyId");

-- CreateIndex
CREATE INDEX "label_history_events_userId_idx" ON "label_history_events"("userId");

-- CreateIndex
CREATE INDEX "label_history_events_createdAt_idx" ON "label_history_events"("createdAt");

-- CreateIndex
CREATE INDEX "label_download_events_labelId_idx" ON "label_download_events"("labelId");

-- CreateIndex
CREATE INDEX "label_download_events_companyId_idx" ON "label_download_events"("companyId");

-- CreateIndex
CREATE INDEX "label_download_events_userId_idx" ON "label_download_events"("userId");

-- CreateIndex
CREATE INDEX "label_download_events_createdAt_idx" ON "label_download_events"("createdAt");

-- Backfill lifecycle history for existing labels
INSERT INTO "label_history_events" (
    "id",
    "labelId",
    "companyId",
    "userId",
    "eventType",
    "summary",
    "changesJson",
    "metadataJson",
    "ipAddress",
    "createdAt"
)
SELECT
    'backfill-history-' || "id",
    "id",
    "companyId",
    "createdBy",
    'CREATE',
    'Backfill inicial de creación',
    '[]',
    NULL,
    NULL,
    "createdAt"
FROM "labels";
