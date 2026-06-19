import { useCallback, useState } from 'react';

const STORAGE_KEY = 'picker-scan-history';

export interface ScanResult {
  labelId: string;
  externalReference: string;
  status: string;
  alreadyDispatched: boolean;
  scannedAt: string;
}

interface StoragePayload {
  date: string;
  labels: ScanResult[];
}

function loadHistory(): ScanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    
    if (Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    const payload = parsed as StoragePayload;
    const today = new Date().toDateString();
    
    if (payload.date !== today) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    
    return payload.labels || [];
  } catch {
    return [];
  }
}

function saveHistory(labels: ScanResult[]) {
  try {
    const payload: StoragePayload = {
      date: new Date().toDateString(),
      labels,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
