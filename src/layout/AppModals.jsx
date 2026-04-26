import TimerModal from "../features/schedule/components/TimerModal";
import MinimizedTimer from "../features/schedule/components/MinimizedTimer";
import QuickTimerPrompt from "../features/schedule/components/QuickTimerPrompt";
import TaskBankModal from "../features/tasks/components/TaskBankModal";
import TaskModal from "../features/tasks/components/TaskModal";
import HelpModal from "../shared/components/HelpModal";
import Confetti from "../shared/components/Confetti";
import ImportConfirmDialog from "../shared/components/ImportConfirmDialog";
import SwitchTaskDialog from "../features/schedule/components/SwitchTaskDialog";
import UnsavedScheduleWarning from "../features/schedule/components/UnsavedScheduleWarning";
import ClearAllConfirm from "../shared/components/ClearAllConfirm";
import { generateId } from "../shared/utils/id";

export default function AppModals({
  // Timer
  timerTask, isTimerMinimized, setIsTimerMinimized,
  scheduleTimers, runningTaskId,
  toggleTimer, closeTimer, restartTimer, startAgainTimer, markTimerTaskDone,
  timerMusic, pomodoroEnabled, setPomodoroEnabled,
  pomodoroMinutes, handleSetPomodoroMinutes, pomodoroResetAt, pomodoroBreakCount,
  // Quick timer
  pendingTimerTask, setPendingTimerTask,
  pendingTimerMinutes, setPendingTimerMinutes,
  setScheduleTimers, openTimer,
  // Task bank
  showTaskBankModal, setShowTaskBankModal,
  taskBank, tasks,
  removeFromBank, addToBank, updateInBank, reorderBank,
  taskBankModalAutoGenerate,
  addTaskDirect, dateKey, onGenerateSchedule,
  // Task modal
  addModal, editModal, isEditing,
  // Help + confetti
  showHelp, setShowHelp, showConfetti,
  // Import
  pendingImport, setPendingImport, importError, importFileRef,
  handleImportFileChange, handleImportConfirm, lang,
  // Switch task
  pendingSwitchTask, setPendingSwitchTask, confirmSwitchTask,
  // Unsaved warning
  showUnsavedWarning, handleUnsavedCancel, handleUnsavedDiscard, handleUnsavedSaveAndContinue,
  // Clear all
  showClearConfirm, setShowClearConfirm, handleClearAll,
  t,
}) {
  return (
    <>
      {timerTask && !isTimerMinimized && (
        <TimerModal
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onPlayPause={toggleTimer}
          onClose={closeTimer}
          onRestart={restartTimer}
          onStartAgain={startAgainTimer}
          onMarkDone={markTimerTaskDone}
          onMinimize={() => setIsTimerMinimized(true)}
          music={timerMusic}
          pomodoroEnabled={pomodoroEnabled}
          setPomodoroEnabled={setPomodoroEnabled}
          pomodoroMinutes={pomodoroMinutes}
          setPomodoroMinutes={handleSetPomodoroMinutes}
          pomodoroResetAt={pomodoroResetAt}
          pomodoroBreakCount={pomodoroBreakCount}
        />
      )}
      {timerTask && isTimerMinimized && (
        <MinimizedTimer
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onExpand={() => setIsTimerMinimized(false)}
          onPlayPause={toggleTimer}
        />
      )}
      {pendingTimerTask && (
        <QuickTimerPrompt
          task={pendingTimerTask}
          minutes={pendingTimerMinutes}
          onChangeMinutes={setPendingTimerMinutes}
          onConfirm={() => {
            setScheduleTimers((prev) => ({ ...prev, [pendingTimerTask.id]: 0 }));
            openTimer({ ...pendingTimerTask, scheduledMinutes: pendingTimerMinutes });
            setPendingTimerTask(null);
          }}
          onCancel={() => setPendingTimerTask(null)}
          t={t}
        />
      )}
      {showTaskBankModal && (
        <TaskBankModal
          taskBank={taskBank}
          tasks={tasks}
          onClose={() => setShowTaskBankModal(false)}
          onRemoveFromBank={removeFromBank}
          onAddToBank={addToBank}
          onUpdateInBank={updateInBank}
          onReorderBank={reorderBank}
          withGenerate={taskBankModalAutoGenerate}
          onConfirm={(selectedTasks) => {
            selectedTasks.forEach(({ text, priority, imageUrl }) =>
              addTaskDirect(dateKey, { id: generateId(), text, priority: !!priority, imageUrl: imageUrl || "", done: false })
            );
            setShowTaskBankModal(false);
            if (taskBankModalAutoGenerate) setTimeout(onGenerateSchedule, 0);
          }}
        />
      )}
      <TaskModal
        isOpen={addModal.isOpen || editModal.isOpen}
        onClose={() => { isEditing ? editModal.reset() : addModal.reset(); }}
        onSave={isEditing ? editModal.handleSubmit : addModal.handleSubmit}
        text={isEditing ? editModal.text : addModal.text}
        setText={isEditing ? editModal.setText : addModal.setText}
        image={isEditing ? editModal.image : addModal.image}
        setImage={isEditing ? editModal.setImage : addModal.setImage}
        priority={isEditing ? editModal.priority : addModal.priority}
        setPriority={isEditing ? editModal.setPriority : addModal.setPriority}
        recurrence={isEditing ? editModal.recurrence : addModal.recurrence}
        setRecurrence={isEditing ? editModal.setRecurrence : addModal.setRecurrence}
        startDate={isEditing ? editModal.startDate : addModal.startDate}
        setStartDate={isEditing ? editModal.setStartDate : addModal.setStartDate}
        endDate={isEditing ? editModal.endDate : addModal.endDate}
        setEndDate={isEditing ? editModal.setEndDate : addModal.setEndDate}
        monthsAhead={isEditing ? editModal.monthsAhead : addModal.monthsAhead}
        setMonthsAhead={isEditing ? editModal.setMonthsAhead : addModal.setMonthsAhead}
        yearsAhead={isEditing ? editModal.yearsAhead : addModal.yearsAhead}
        setYearsAhead={isEditing ? editModal.setYearsAhead : addModal.setYearsAhead}
        isRecurringInstance={isEditing ? editModal.isRecurringInstance : false}
        moveToDate={isEditing && !editModal.isRecurringInstance ? editModal.targetDate : undefined}
        setMoveToDate={isEditing && !editModal.isRecurringInstance ? editModal.setTargetDate : undefined}
        title={isEditing ? t.editTaskTitle : t.addTaskTitle}
      />
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <Confetti active={showConfetti} />
      <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportFileChange} />
      {importError && (
        <div className="fixed bottom-20 left-6 z-50 bg-error text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold max-w-xs">{importError}</div>
      )}
      {pendingImport && (
        <ImportConfirmDialog
          exportedAt={pendingImport.exportedAt}
          lang={lang}
          onCancel={() => setPendingImport(null)}
          onConfirm={handleImportConfirm}
          t={t}
        />
      )}
      {pendingSwitchTask && timerTask && (
        <SwitchTaskDialog
          fromTask={timerTask}
          toTask={pendingSwitchTask}
          onConfirm={confirmSwitchTask}
          onCancel={() => setPendingSwitchTask(null)}
          t={t}
        />
      )}
      {showUnsavedWarning && (
        <UnsavedScheduleWarning
          onCancel={handleUnsavedCancel}
          onDiscard={handleUnsavedDiscard}
          onSaveAndContinue={handleUnsavedSaveAndContinue}
          t={t}
        />
      )}
      {showClearConfirm && (
        <ClearAllConfirm
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={handleClearAll}
          t={t}
        />
      )}
    </>
  );
}
