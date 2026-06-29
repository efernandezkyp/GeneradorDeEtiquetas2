-- AlterEnum
ALTER TYPE "LabelStatus" ADD VALUE 'DESCARGADA';

-- DataMigration: etiquetas PENDIENTE que ya fueron descargadas pasan a DESCARGADA
UPDATE "labels"
SET "status" = 'DESCARGADA'::"LabelStatus"
WHERE "status" = 'PENDIENTE'::"LabelStatus"
  AND "id" IN (
    SELECT DISTINCT "labelId" FROM "label_download_events"
  );
