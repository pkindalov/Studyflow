import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { TIMERS_KEY, readAllTimers, writeTimersForDate } from "../utils/scheduleStorage";

export function useTimer({ dateKey, music, markTaskDone }) {
  const skipTimerPersistRef = useRef(true);

  const [timerTask, setTimerTask] = useState(null);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [scheduleTimers, setScheduleTimers] = useState({});
  const [taskAllocations, setTaskAllocations] = useState({});
  const [pendingTimerTask, setPendingTimerTask] = useState(null);
  const [pendingTimerMinutes, setPendingTimerMinutes] = useState(25);
  const [pendingSwitchTask, setPendingSwitchTask] = useState(null);

  const [pomodoroEnabled, setPomodoroEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pomodoro_enabled")) ?? false; } catch { return false; }
  });
  const [pomodoroMinutes, setPomodoroMinutes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pomodoro_minutes")) ?? 25; } catch { return 25; }
  });
  const [pomodoroResetAt, setPomodoroResetAt] = useState(0);
  const [pomodoroBreakCount, setPomodoroBreakCount] = useState(0);

  const scheduleTimersRef = useRef({});
  const timerStartRef = useRef(null);
  const lastTimerTaskIdRef = useRef(null);
  const timerTaskRef = useRef(null);
  const timerOriginDateKeyRef = useRef(null);
  const dateKeyRef = useRef(dateKey);
  const musicWasPlayingRef = useRef(false);
  const musicStartedFromTimerRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { scheduleTimersRef.current = scheduleTimers; }, [scheduleTimers]);
  useEffect(() => { timerTaskRef.current = timerTask; }, [timerTask]);
  useEffect(() => { dateKeyRef.current = dateKey; }, [dateKey]);

  // Pomodoro persistence
  useEffect(() => {
    localStorage.setItem("pomodoro_enabled", JSON.stringify(pomodoroEnabled));
  }, [pomodoroEnabled]);
  useEffect(() => {
    localStorage.setItem("pomodoro_minutes", JSON.stringify(pomodoroMinutes));
  }, [pomodoroMinutes]);

  // Load timers for the selected date; preserve active task's elapsed across date switches
  useEffect(() => {
    const allTimers = readAllTimers();
    skipTimerPersistRef.current = true;
    setScheduleTimers((prev) => {
      const next = allTimers[dateKey] || {};
      const active = timerTaskRef.current;
      if (active && prev[active.id] !== undefined) {
        return { ...next, [active.id]: prev[active.id] };
      }
      return next;
    });
    if (!timerTaskRef.current) {
      setRunningTaskId(null);
      setTimerTask(null);
    }
    setTaskAllocations({});
  }, [dateKey]);

  // Persist timers on every tick; handles cross-date timer (origin ≠ current date)
  useEffect(() => {
    if (skipTimerPersistRef.current) {
      skipTimerPersistRef.current = false;
      return;
    }
    const active = timerTaskRef.current;
    const originKey = timerOriginDateKeyRef.current;
    if (active && originKey && originKey !== dateKey) {
      const allT = readAllTimers();
      writeTimersForDate(originKey, { ...(allT[originKey] || {}), [active.id]: scheduleTimers[active.id] || 0 });
      const { [active.id]: _dropped, ...rest } = scheduleTimers;
      writeTimersForDate(dateKey, rest);
    } else {
      writeTimersForDate(dateKey, scheduleTimers);
    }
  }, [scheduleTimers, dateKey]);

  // Wall-clock countdown interval — survives tab throttling
  useEffect(() => {
    if (!runningTaskId || !timerTask) return;
    const totalSeconds = timerTask.scheduledMinutes * 60;
    const taskId = runningTaskId;
    const startedAt = Date.now();
    const baseElapsed = scheduleTimersRef.current[taskId] || 0;
    timerStartRef.current = { startedAt, baseElapsed, taskId, totalSeconds };

    const tick = () => {
      const { startedAt: sa, baseElapsed: be, taskId: tid, totalSeconds: ts } = timerStartRef.current;
      setScheduleTimers((prev) => ({ ...prev, [tid]: Math.min(ts, be + Math.floor((Date.now() - sa) / 1000)) }));
    };

    const interval = setInterval(tick, 1000);
    return () => { clearInterval(interval); timerStartRef.current = null; };
  }, [runningTaskId, timerTask]);

  // Catch up immediately when tab becomes visible again
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== "visible" || !timerStartRef.current) return;
      const { startedAt, baseElapsed, taskId, totalSeconds } = timerStartRef.current;
      setScheduleTimers((prev) => ({
        ...prev,
        [taskId]: Math.min(totalSeconds, baseElapsed + Math.floor((Date.now() - startedAt) / 1000)),
      }));
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // Document title reflects timer state for background-tab awareness
  useEffect(() => {
    if (!timerTask) {
      document.title = "StudyFlow";
      return () => { document.title = "StudyFlow"; };
    }
    document.title = runningTaskId ? `⏱ ${timerTask.text} — StudyFlow` : `⏸ Paused — StudyFlow`;
    return () => { document.title = "StudyFlow"; };
  }, [timerTask, runningTaskId]);

  // Completion & Pomodoro break detection — runs after each tick
  useEffect(() => {
    if (!runningTaskId || !timerTask) return;
    const totalSeconds = timerTask.scheduledMinutes * 60;
    const elapsed = scheduleTimers[runningTaskId] || 0;
    if (elapsed >= totalSeconds) {
      setRunningTaskId(null);
      markTaskDone(timerOriginDateKeyRef.current || dateKey, runningTaskId);
      if (musicStartedFromTimerRef.current) {
        music.pause();
        musicStartedFromTimerRef.current = false;
      }
      return;
    }
    const pomodoroSeconds = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
    if (pomodoroSeconds > 0 && elapsed > pomodoroResetAt && (elapsed - pomodoroResetAt) % pomodoroSeconds === 0) {
      setPomodoroResetAt(elapsed);
      setPomodoroBreakCount((n) => n + 1);
      setRunningTaskId(null);
      music.pause();
    }
  }, [scheduleTimers, runningTaskId, timerTask, dateKey, markTaskDone, pomodoroEnabled, pomodoroMinutes, pomodoroResetAt, music]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const openTimer = useCallback((task) => {
    if (timerTask && timerTask.id === task.id) {
      setIsTimerMinimized(false);
      return;
    }
    if (timerTask) {
      setPendingSwitchTask(task);
      return;
    }
    if (lastTimerTaskIdRef.current !== task.id) {
      const elapsed = scheduleTimersRef.current[task.id] || 0;
      const pomSec = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
      if (pomSec > 0 && elapsed > 0) {
        const breakCount = Math.floor(elapsed / pomSec);
        setPomodoroBreakCount(breakCount);
        setPomodoroResetAt(breakCount * pomSec);
      } else {
        setPomodoroResetAt(0);
        setPomodoroBreakCount(0);
      }
      lastTimerTaskIdRef.current = task.id;
    }
    timerOriginDateKeyRef.current = dateKeyRef.current;
    setTimerTask(task);
    setIsTimerMinimized(false);
    setTaskAllocations((prev) => ({ ...prev, [task.id]: task.scheduledMinutes }));
    if ((scheduleTimersRef.current[task.id] || 0) < task.scheduledMinutes * 60) {
      setRunningTaskId(task.id);
    }
  }, [pomodoroEnabled, pomodoroMinutes, timerTask]);

  const confirmSwitchTask = useCallback(() => {
    if (!pendingSwitchTask) return;
    const next = pendingSwitchTask;
    setPendingSwitchTask(null);
    setRunningTaskId(null);
    setTimerTask(null);
    setIsTimerMinimized(false);
    music.pause();
    musicStartedFromTimerRef.current = false;
    const elapsed = scheduleTimersRef.current[next.id] || 0;
    if (lastTimerTaskIdRef.current !== next.id) {
      const pomSec = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
      if (pomSec > 0 && elapsed > 0) {
        const breakCount = Math.floor(elapsed / pomSec);
        setPomodoroBreakCount(breakCount);
        setPomodoroResetAt(breakCount * pomSec);
      } else {
        setPomodoroResetAt(0);
        setPomodoroBreakCount(0);
      }
      lastTimerTaskIdRef.current = next.id;
    }
    timerOriginDateKeyRef.current = dateKeyRef.current;
    setTimerTask(next);
    setTaskAllocations((prev) => ({ ...prev, [next.id]: next.scheduledMinutes }));
    if (elapsed < next.scheduledMinutes * 60) {
      setRunningTaskId(next.id);
    }
  }, [pendingSwitchTask, pomodoroEnabled, pomodoroMinutes, music]);

  const closeTimer = useCallback(() => {
    timerOriginDateKeyRef.current = null;
    setRunningTaskId(null);
    setTimerTask(null);
    setIsTimerMinimized(false);
    music.pause();
    musicStartedFromTimerRef.current = false;
  }, [music]);

  const markTimerTaskDone = useCallback(() => {
    if (!timerTask) return;
    setRunningTaskId(null);
    markTaskDone(timerOriginDateKeyRef.current || dateKey, timerTask.id);
    timerOriginDateKeyRef.current = null;
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: timerTask.scheduledMinutes * 60 }));
    music.pause();
    setTimerTask(null);
  }, [timerTask, dateKey, markTaskDone, music]);

  // Exposed so App.jsx can build restartTimer / startAgainTimer which also need
  // toggleTask (useTasks) and markScheduleItemUndone (useSchedule).
  const resetPomodoroState = useCallback(() => {
    setPomodoroResetAt(0);
    setPomodoroBreakCount(0);
  }, []);

  const toggleTimer = useCallback(() => {
    if (!timerTask) return;
    if (runningTaskId === timerTask.id) {
      musicWasPlayingRef.current = music.isPlaying;
      setRunningTaskId(null);
      music.pause();
    } else {
      const elapsed = scheduleTimers[timerTask.id] || 0;
      if (elapsed < timerTask.scheduledMinutes * 60) {
        const pomSec = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
        if (pomSec > 0 && elapsed > pomodoroResetAt && (elapsed - pomodoroResetAt) % pomSec === 0) {
          setPomodoroResetAt(elapsed);
        }
        setRunningTaskId(timerTask.id);
        if (elapsed === 0 || musicWasPlayingRef.current) {
          music.play();
          musicStartedFromTimerRef.current = true;
        }
      }
    }
  }, [timerTask, runningTaskId, scheduleTimers, music, pomodoroEnabled, pomodoroMinutes, pomodoroResetAt]);

  const handleTimerMusicToggle = useCallback(() => {
    if (!music.isPlaying) musicStartedFromTimerRef.current = true;
    music.togglePlay();
  }, [music]);

  const handleMainMusicToggle = useCallback(() => {
    if (!music.isPlaying) musicStartedFromTimerRef.current = false;
    music.togglePlay();
  }, [music]);

  const timerMusic = useMemo(() => ({ ...music, togglePlay: handleTimerMusicToggle }), [music, handleTimerMusicToggle]);

  const handleSetPomodoroMinutes = useCallback((val) => {
    const currentElapsed = timerTask ? (scheduleTimers[timerTask.id] || 0) : 0;
    setPomodoroResetAt(currentElapsed);
    setPomodoroBreakCount(0);
    setPomodoroMinutes(val);
  }, [timerTask, scheduleTimers]);

  const resetTimer = useCallback(() => {
    setTimerTask(null);
    setRunningTaskId(null);
    setScheduleTimers({});
    setTaskAllocations({});
    setIsTimerMinimized(false);
    musicStartedFromTimerRef.current = false;
  }, []);

  return {
    timerTask,
    setTimerTask,
    isTimerMinimized,
    setIsTimerMinimized,
    runningTaskId,
    setRunningTaskId,
    scheduleTimers,
    setScheduleTimers,
    taskAllocations,
    pendingTimerTask,
    setPendingTimerTask,
    pendingTimerMinutes,
    setPendingTimerMinutes,
    pendingSwitchTask,
    setPendingSwitchTask,
    pomodoroEnabled,
    setPomodoroEnabled,
    pomodoroMinutes,
    pomodoroResetAt,
    pomodoroBreakCount,
    openTimer,
    confirmSwitchTask,
    closeTimer,
    markTimerTaskDone,
    resetPomodoroState,
    toggleTimer,
    handleMainMusicToggle,
    timerMusic,
    handleSetPomodoroMinutes,
    resetTimer,
    timerOriginDateKeyRef,
  };
}
