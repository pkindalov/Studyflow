import CalendarSidebar from "../features/calendar/components/CalendarSidebar";
import { StudyTimeSection, PrioritySection, QuoteSection, TasksProgressSection } from "../features/dashboard/components/RightSidebar";
import { ActivityPanel } from "../features/dashboard/components/ActivityPanel";
import MusicPanel from "../features/music/components/MusicPanel";

export function buildSidebarSections({
  selectedDate,
  handleDateChange,
  markDateWithTasksFn,
  addModal,
  dateKey,
  showCalendarCompletion,
  setShowCalendarCompletion,
  tasks,
  totalStudyTime,
  setTotalStudyTime,
  priorityPercent,
  setPriorityPercent,
  recurringTasks,
  tasksForDay,
  scheduleTimers,
  taskAllocations,
  music,
  handleMainMusicToggle,
}) {
  return {
    calendar: (
      <CalendarSidebar
        selectedDate={selectedDate}
        setSelectedDate={handleDateChange}
        markDateWithTasks={markDateWithTasksFn}
        onAddClick={() => addModal.open({ startDate: dateKey })}
        showCompletion={showCalendarCompletion}
        onToggleCompletion={() => setShowCalendarCompletion((v) => !v)}
      />
    ),
    activity: <ActivityPanel tasks={tasks} />,
    studyTime: <StudyTimeSection totalStudyTime={totalStudyTime} setTotalStudyTime={setTotalStudyTime} />,
    priorityPercent: <PrioritySection priorityPercent={priorityPercent} setPriorityPercent={setPriorityPercent} />,
    quote: <QuoteSection />,
    todaysTasks: (
      <TasksProgressSection
        tasks={tasks}
        recurringTasks={recurringTasks}
        tasksForDay={tasksForDay}
        scheduleTimers={scheduleTimers}
        taskAllocations={taskAllocations}
      />
    ),
    music: (
      <MusicPanel
        playlist={music.playlist}
        activeTrackId={music.activeTrackId}
        activeTrack={music.activeTrack}
        isPlaying={music.isPlaying}
        volume={music.volume}
        playbackError={music.playbackError}
        onSelectTrack={music.selectTrack}
        onAddTrack={music.addTrack}
        onRemoveTrack={music.removeTrack}
        onTogglePlay={handleMainMusicToggle}
        onSetVolume={music.setVolume}
        onClearPlaybackError={music.clearPlaybackError}
      />
    ),
  };
}
