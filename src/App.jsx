import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import "react-calendar/dist/Calendar.css";
import { useTasks } from "./features/tasks/hooks/useTasks";
import { useMusicPlayer } from "./features/music/hooks/useMusicPlayer";
import { useRecurringTasks, appliesToDate } from "./features/tasks/hooks/useRecurringTasks";
import { markDateWithTasks } from "./features/calendar/utils/markDateWithTasks";
import { generateId } from "./shared/utils/id";
import { useTaskBank } from "./features/tasks/hooks/useTaskBank";
import { exportData } from "./shared/utils/dataPortability";
import { useLang } from "./shared/i18n/LangContext";
import { useColumnLayout } from "./features/dashboard/hooks/useColumnLayout";
import { useTimer } from "./features/schedule/hooks/useTimer";
import { useSchedule } from "./features/schedule/hooks/useSchedule";
import { useTaskModal } from "./features/tasks/hooks/useTaskModal";
import { useDataPortability } from "./shared/hooks/useDataPortability";
import { useTimerActions } from "./features/schedule/hooks/useTimerActions";
import { useTaskActions } from "./features/tasks/hooks/useTaskActions";
import { runMigrations } from "./features/schedule/utils/migrateScheduleStorage";
import { buildSidebarSections } from "./layout/sidebarSections";
import SortableSection from "./layout/SortableSection";
import TopBar from "./layout/TopBar";
import BottomBar from "./layout/BottomBar";
import MainContent from "./layout/MainContent";
import AppModals from "./layout/AppModals";
import "./features/calendar/calendar.css";
import "./animations.css";

const formatDateKey = (date) => date.toLocaleDateString("en-CA");

runMigrations();

function App() {
  const { lang, setLang, t } = useLang();
  const [theme, setTheme] = useState(() => localStorage.getItem("studyflow_theme") || "dark");
  const [showCalendarCompletion, setShowCalendarCompletion] = useState(
    () => localStorage.getItem("studyflow_calendar_completion") === "true"
  );
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState("");
  const [priorityPercent, setPriorityPercent] = useState(40);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalStudyTime, setTotalStudyTime] = useState(4);
  const [excludedTaskIds, setExcludedTaskIds] = useState(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTaskBankModal, setShowTaskBankModal] = useState(false);
  const [taskBankModalAutoGenerate, setTaskBankModalAutoGenerate] = useState(false);
  const prevAllScheduleDoneRef = useRef(false);

  const dateKey = formatDateKey(selectedDate);

  const { tasks, addTask, addTaskDirect, toggleTask, markTaskDone, deleteTask, editTask, linkRecurring, deleteAllByRecurringId, moveTask, reorderTasks, clearAllTasks } = useTasks();
  const { recurringTasks, addRecurring, updateRecurring, deleteRecurring, clearAllRecurring } = useRecurringTasks();
  const { taskBank, addToBank, removeFromBank, updateInBank, reorderBank } = useTaskBank();
  const music = useMusicPlayer();
  const { columnLayout, sectionSensors, handleSectionDragStart, handleSectionDragOver, handleSectionDragEnd, resetLayout, isCustomLayout } = useColumnLayout();

  const tasksForDay = useMemo(() => tasks[dateKey] || [], [tasks, dateKey]);
  const { totalTasks, completedTasks, remainingTasks, progress } = useMemo(() => {
    const total = tasksForDay.length;
    const completed = tasksForDay.filter((t) => t.done).length;
    return { totalTasks: total, completedTasks: completed, remainingTasks: total - completed, progress: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [tasksForDay]);
  const savedListTexts = useMemo(() => new Set(taskBank.map((t) => t.text)), [taskBank]);
  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }, []);

  const {
    timerTask, isTimerMinimized, setIsTimerMinimized, runningTaskId, setRunningTaskId,
    scheduleTimers, setScheduleTimers, taskAllocations, pendingTimerTask, setPendingTimerTask,
    pendingTimerMinutes, setPendingTimerMinutes, pendingSwitchTask, setPendingSwitchTask,
    pomodoroEnabled, setPomodoroEnabled, pomodoroMinutes, pomodoroResetAt, pomodoroBreakCount,
    openTimer, confirmSwitchTask, closeTimer, markTimerTaskDone, resetPomodoroState,
    toggleTimer, handleMainMusicToggle, timerMusic, handleSetPomodoroMinutes, resetTimer, timerOriginDateKeyRef,
  } = useTimer({ dateKey, music, markTaskDone });

  const {
    schedule, showUnsavedWarning, allScheduleDone, scheduleSensors, handleScheduleDragEnd,
    generateSchedule, checkUnsaved, saveSchedule, deleteSchedule, handleMarkScheduleItemDone,
    handleRemoveScheduleItem, markScheduleItemUndone, removeTaskFromSchedule,
    handleUnsavedSaveAndContinue, handleUnsavedDiscard, handleUnsavedCancel, clearSchedule,
  } = useSchedule({ dateKey, tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent, scheduleTimers, setScheduleTimers, runningTaskId, setRunningTaskId, markTaskDone, showNotification, t });

  const addModal = useTaskModal({ mode: "add", dateKey, addTask, addRecurring });
  const editModal = useTaskModal({ mode: "edit", dateKey, tasks, recurringTasks, editTask, moveTask, updateRecurring, addRecurring, linkRecurring, deleteRecurring, deleteAllByRecurringId, removeTaskFromSchedule, setScheduleTimers });
  const isEditing = editModal.isOpen;
  const { pendingImport, setPendingImport, importError, importFileRef, handleImportFileChange, handleImportConfirm } = useDataPortability();

  const { openTimerForTask, restartTimer, startAgainTimer } = useTimerActions({
    timerTask, dateKey, openTimer, schedule, scheduleTimers, taskAllocations,
    setScheduleTimers, setPendingTimerTask, setPendingTimerMinutes,
    resetPomodoroState, toggleTask, markScheduleItemUndone, setRunningTaskId,
    timerOriginDateKeyRef, music,
  });

  const { handleDeleteTask, handleStopRecurring, handleSaveToBank, handleOpenSavedList, handleReorder } = useTaskActions({
    tasks, dateKey, deleteTask, deleteRecurring, deleteAllByRecurringId,
    removeTaskFromSchedule, reorderTasks, taskBank, savedListTexts,
    addToBank, removeFromBank, showNotification, t,
    setShowTaskBankModal, setTaskBankModalAutoGenerate,
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studyflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("studyflow_calendar_completion", String(showCalendarCompletion));
  }, [showCalendarCompletion]);

  useEffect(() => { setExcludedTaskIds(new Set()); }, [dateKey]);

  useEffect(() => {
    if (allScheduleDone && !prevAllScheduleDoneRef.current) {
      prevAllScheduleDoneRef.current = true;
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4500);
      return () => clearTimeout(t);
    }
    if (!allScheduleDone) prevAllScheduleDoneRef.current = false;
  }, [allScheduleDone]);

  useEffect(() => {
    const existingIds = new Set((tasks[dateKey] || []).map((t) => t.recurringId).filter(Boolean));
    recurringTasks.forEach((template) => {
      if (existingIds.has(template.id)) return;
      if ((template.skippedDates || []).includes(dateKey)) return;
      if (!appliesToDate(template, dateKey)) return;
      addTaskDirect(dateKey, { id: generateId(), text: template.text, imageUrl: template.imageUrl, priority: template.priority, done: false, recurringId: template.id });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, recurringTasks]);

  const markDateWithTasksFn = useMemo(
    () => markDateWithTasks(tasks, formatDateKey, recurringTasks, showCalendarCompletion),
    [tasks, recurringTasks, showCalendarCompletion],
  );

  const toggleTaskSelection = useCallback((id) => {
    setExcludedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleToggleTask = useCallback((id) => {
    const task = (tasks[dateKey] || []).find((t) => t.id === id);
    toggleTask(dateKey, id);
    if (!task || !schedule) return;
    const inSchedule = schedule.find((s) => s.id === id);
    if (!inSchedule) return;
    setScheduleTimers((prev) => ({ ...prev, [id]: !task.done ? inSchedule.scheduledMinutes * 60 : 0 }));
  }, [tasks, dateKey, toggleTask, schedule, setScheduleTimers]);

  const handleDateChange = useCallback((newDate) => checkUnsaved(() => setSelectedDate(newDate)), [checkUnsaved]);

  const handleGenerateSchedule = useCallback(() => {
    generateSchedule(() => {
      const allDone = tasksForDay.length > 0 && tasksForDay.every((task) => task.done);
      if (allDone) { showNotification(t.allDoneNothing); return; }
      setTaskBankModalAutoGenerate(true);
      setShowTaskBankModal(true);
    });
  }, [generateSchedule, tasksForDay, showNotification, t]);

  const handleClearAll = useCallback(() => {
    clearAllTasks(); clearAllRecurring(); clearSchedule(); resetTimer();
    setExcludedTaskIds(new Set()); resetLayout(); setShowClearConfirm(false);
  }, [clearAllTasks, clearAllRecurring, clearSchedule, resetTimer, resetLayout]);

  const sectionJsx = buildSidebarSections({
    selectedDate, handleDateChange, markDateWithTasksFn, addModal, dateKey,
    showCalendarCompletion, setShowCalendarCompletion, tasks, totalStudyTime, setTotalStudyTime,
    priorityPercent, setPriorityPercent, recurringTasks, tasksForDay,
    scheduleTimers, taskAllocations, music, handleMainMusicToggle,
  });

  const sideColClass = "lg:col-span-3 flex flex-col gap-4 lg:gap-6 rounded-2xl min-h-16";

  return (
    <div className={`min-h-dvh p-4 sm:p-6 pt-6 ${theme === "light" ? "bg-[#f0eeff]" : "bg-[#0c0c1a]"}`}>
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-lg font-semibold animate-fade-in text-sm text-center max-w-[90vw]">
          {notification}
        </div>
      )}
      <TopBar onShowHelp={() => setShowHelp(true)} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
      <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragStart={handleSectionDragStart} onDragOver={handleSectionDragOver} onDragEnd={handleSectionDragEnd}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className={sideColClass}>
            <SortableContext items={columnLayout.left} strategy={verticalListSortingStrategy}>
              {columnLayout.left.map((id) => (
                <SortableSection key={id} id={id} t={t}>{sectionJsx[id]}</SortableSection>
              ))}
            </SortableContext>
          </div>
          <MainContent
            total={totalTasks} completed={completedTasks} remaining={remainingTasks} progress={progress}
            tasks={tasksForDay} onToggle={handleToggleTask} onDelete={handleDeleteTask}
            onStopRecurring={handleStopRecurring} excludedTaskIds={excludedTaskIds}
            onToggleSelect={toggleTaskSelection} onOpenTimer={openTimerForTask}
            onSaveToBank={handleSaveToBank} onOpenSavedList={handleOpenSavedList}
            savedListTexts={savedListTexts} onReorder={handleReorder} onEdit={editModal.open}
            onGenerateSchedule={handleGenerateSchedule} schedule={schedule}
            allScheduleDone={allScheduleDone} scheduleTimers={scheduleTimers}
            runningTaskId={runningTaskId} scheduleSensors={scheduleSensors}
            onScheduleDragEnd={handleScheduleDragEnd} onOpenScheduleTimer={openTimer}
            onMarkScheduleDone={handleMarkScheduleItemDone} onRemoveScheduleItem={handleRemoveScheduleItem}
            onSaveSchedule={saveSchedule} onDeleteSchedule={deleteSchedule} t={t}
          />
          <div className={sideColClass}>
            <SortableContext items={columnLayout.right} strategy={verticalListSortingStrategy}>
              {columnLayout.right.map((id) => (
                <SortableSection key={id} id={id} t={t}>{sectionJsx[id]}</SortableSection>
              ))}
            </SortableContext>
          </div>
        </div>
      </DndContext>
      <BottomBar onExport={exportData} onImport={() => importFileRef.current?.click()} onShowClearConfirm={() => setShowClearConfirm(true)} isCustomLayout={isCustomLayout} onResetLayout={resetLayout} t={t} />
      <AppModals
        timerTask={timerTask} isTimerMinimized={isTimerMinimized} setIsTimerMinimized={setIsTimerMinimized}
        scheduleTimers={scheduleTimers} runningTaskId={runningTaskId} toggleTimer={toggleTimer}
        closeTimer={closeTimer} restartTimer={restartTimer} startAgainTimer={startAgainTimer}
        markTimerTaskDone={markTimerTaskDone} timerMusic={timerMusic}
        pomodoroEnabled={pomodoroEnabled} setPomodoroEnabled={setPomodoroEnabled}
        pomodoroMinutes={pomodoroMinutes} handleSetPomodoroMinutes={handleSetPomodoroMinutes}
        pomodoroResetAt={pomodoroResetAt} pomodoroBreakCount={pomodoroBreakCount}
        pendingTimerTask={pendingTimerTask} setPendingTimerTask={setPendingTimerTask}
        pendingTimerMinutes={pendingTimerMinutes} setPendingTimerMinutes={setPendingTimerMinutes}
        setScheduleTimers={setScheduleTimers} openTimer={openTimer}
        showTaskBankModal={showTaskBankModal} setShowTaskBankModal={setShowTaskBankModal}
        taskBank={taskBank} tasks={tasks} removeFromBank={removeFromBank}
        addToBank={addToBank} updateInBank={updateInBank} reorderBank={reorderBank}
        taskBankModalAutoGenerate={taskBankModalAutoGenerate} addTaskDirect={addTaskDirect}
        dateKey={dateKey} onGenerateSchedule={handleGenerateSchedule}
        addModal={addModal} editModal={editModal} isEditing={isEditing}
        showHelp={showHelp} setShowHelp={setShowHelp} showConfetti={showConfetti}
        pendingImport={pendingImport} setPendingImport={setPendingImport}
        importError={importError} importFileRef={importFileRef}
        handleImportFileChange={handleImportFileChange} handleImportConfirm={handleImportConfirm}
        lang={lang} pendingSwitchTask={pendingSwitchTask} setPendingSwitchTask={setPendingSwitchTask}
        confirmSwitchTask={confirmSwitchTask} showUnsavedWarning={showUnsavedWarning}
        handleUnsavedCancel={handleUnsavedCancel} handleUnsavedDiscard={handleUnsavedDiscard}
        handleUnsavedSaveAndContinue={handleUnsavedSaveAndContinue}
        showClearConfirm={showClearConfirm} setShowClearConfirm={setShowClearConfirm}
        handleClearAll={handleClearAll} t={t}
      />
    </div>
  );
}

export default App;
