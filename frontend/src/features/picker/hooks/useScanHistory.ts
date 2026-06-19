import { useCallback, useState } from 'react';

const STORAGE_KEY = 'picker-scan-history';

export interface ScanResult {
  labelId: string;
  externalReference: string;
  status: string;
  alreadyDispatched: boolean;
  scannedAt: string;
}

function loadHistory(): ScanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanResult[];
  } catch {
    return [];
  }
}

function saveHistory(labels: ScanResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  } catch {
    // storage full or unavailable
  }
}

export function useScanHistory() {
  const [scannedLabels, setScannedLabels] = useState<ScanResult[]>(loadHistory);

  const addScanResult = useCallback((result: ScanResult) => {
    setScannedLabels((prev) => {
      const updated = [result, ...prev];
      saveHistory(updated);
      return updated;
    });
  }, []);

  const replaceHistory = useCallback((labels: ScanResult[]) => {
    setScannedLabels(labels);
    saveHistory(labels);
  }, []);

  const clearHistory = useCallback(() => {
    setScannedLabels([]);
    saveHistory([]);
  }, []);

  return { scannedLabels, addScanResult, replaceHistory, clearHistory };
}
