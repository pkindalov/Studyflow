const STATIC_KEYS = [
  "studyflow_tasks",
  "studyflow_recurring",
  "studyflow_task_bank",
  "studyflow_schedules",
  "studyflow_schedule_timers",
  "studyflow_focus_extra",
  "studyflow_theme",
  "studyflow_calendar_completion",
  "studyflow_column_layout",
  "pomodoro_enabled",
  "pomodoro_minutes",
  "music_playlist",
  "music_active_track",
  "music_volume",
];

export const exportData = function() {
  const data = {};

  STATIC_KEYS.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  });

  // Dynamic keys: all schedule_* and schedule_timers_*
  Object.keys(localStorage)
    .filter((key) => key.startsWith("schedule_"))
    .forEach((key) => {
      const val = localStorage.getItem(key);
      if (val !== null) data[key] = val;
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

export const readBackupFile = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
          reject(new Error("This doesn't look like a Studyflow backup file."));
          return;
        }
        const hasInvalidValues = Object.values(payload.data).some((v) => typeof v !== "string");
        if (hasInvalidValues) {
          reject(new Error("Backup file contains invalid data and cannot be restored."));
          return;
        }
        const rawExportedAt = payload.exportedAt ?? null;
        const exportedAt =
          rawExportedAt && !isNaN(new Date(rawExportedAt).getTime())
            ? rawExportedAt
            : null;
        resolve({
          exportedAt,
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

export const applyBackup = function(rawData) {
  // Remove existing app keys
  const keysToRemove = Object.keys(localStorage).filter(
    (key) => STATIC_KEYS.includes(key) || key.startsWith("schedule_") || key.startsWith("studyflow_schedule")
  );
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Write backup
  Object.entries(rawData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}
