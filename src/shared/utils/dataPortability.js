const STATIC_KEYS = [
  "studyflow_tasks",
  "studyflow_recurring",
  "studyflow_task_bank",
  "studyflow_theme",
  "studyflow_calendar_completion",
  "studyflow_column_layout",
  "pomodoro_enabled",
  "pomodoro_minutes",
  "music_playlist",
  "music_active_track",
  "music_volume",
];

/**
 * Serialises all app data into a JSON file and triggers a browser download.
 */
export function exportData() {
  const data = {};

  STATIC_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  });

  // Dynamic keys: all schedule_* and schedule_timers_*
  Object.keys(localStorage)
    .filter((k) => k.startsWith("schedule_"))
    .forEach((k) => {
      data[k] = localStorage.getItem(k);
    });

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `studyflow-backup-${new Date().toLocaleDateString("en-CA")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reads a backup JSON file and returns a summary before the caller commits the restore.
 * @param {File} file
 * @returns {Promise<{ exportedAt: string, keyCount: number, rawData: Object }>}
 */
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload.data || typeof payload.data !== "object") {
          reject(new Error("This doesn't look like a Studyflow backup file."));
          return;
        }
        resolve({
          exportedAt: payload.exportedAt || null,
          keyCount: Object.keys(payload.data).length,
          rawData: payload.data,
        });
      } catch {
        reject(new Error("Failed to parse the file. Make sure it's a valid Studyflow backup."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsText(file);
  });
}

/**
 * Wipes current app data and writes the backup data to localStorage.
 * @param {Object} rawData - The `data` object from a backup payload
 */
export function applyBackup(rawData) {
  // Remove existing app keys
  const keysToRemove = Object.keys(localStorage).filter(
    (k) => STATIC_KEYS.includes(k) || k.startsWith("schedule_")
  );
  keysToRemove.forEach((k) => localStorage.removeItem(k));

  // Write backup
  Object.entries(rawData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}
