import { useState, useRef, useCallback } from "react";
import { readBackupFile, applyBackup } from "../utils/dataPortability";

export function useDataPortability() {
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState("");
  const importFileRef = useRef(null);

  const handleImportFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setImportError("");
    try {
      const summary = await readBackupFile(file);
      setPendingImport(summary);
    } catch (err) {
      setImportError(err.message);
    }
  }, []);

  const handleImportConfirm = useCallback(() => {
    if (!pendingImport) return;
    applyBackup(pendingImport.rawData);
    setPendingImport(null);
    window.location.reload();
  }, [pendingImport]);

  return {
    pendingImport,
    setPendingImport,
    importError,
    setImportError,
    importFileRef,
    handleImportFileChange,
    handleImportConfirm,
  };
}
