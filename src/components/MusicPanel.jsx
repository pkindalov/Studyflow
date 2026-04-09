import React, { useState } from "react";
import { extractVideoId } from "../hooks/useMusicPlayer";

function MusicPanel({
  playlist,
  activeTrackId,
  activeTrack,
  isPlaying,
  volume,
  onSelectTrack,
  onAddTrack,
  onRemoveTrack,
  onTogglePlay,
  onSetVolume,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState("");

  function handleAdd() {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name) return setAddError("Please enter a track name.");
    if (!extractVideoId(url)) return setAddError("Invalid YouTube URL.");
    setAddError("");
    onAddTrack(name, url);
    setNewName("");
    setNewUrl("");
    setShowAdd(false);
  }

  return (
    <section className="bg-surface-container rounded-2xl border border-outline-variant/50 flex flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
        <span className="material-symbols-outlined text-xl text-tertiary">
          headphones
        </span>
        <span className="font-headline font-bold text-on-surface text-lg flex-1">
          Focus Music
        </span>
        {activeTrack && (
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
              isPlaying
                ? "bg-tertiary/20 text-tertiary hover:bg-tertiary/30"
                : "bg-primary text-on-primary hover:opacity-90"
            }`}
            title={isPlaying ? "Pause music" : "Play music"}
          >
            <span className="material-symbols-outlined text-base">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
        )}
      </div>

      {/* Now Playing bar */}
      {activeTrack && (
        <div
          className={`mx-4 mb-3 rounded-xl px-3 py-2 flex items-center gap-2 border transition-all ${
            isPlaying
              ? "bg-tertiary/10 border-tertiary/30"
              : "bg-surface-container-high border-outline-variant/30"
          }`}
        >
          <span
            className={`material-symbols-outlined text-base flex-shrink-0 ${isPlaying ? "text-tertiary" : "text-on-surface-variant"}`}
          >
            {isPlaying ? "music_note" : "music_off"}
          </span>
          <span className="text-xs font-medium text-on-surface flex-1 truncate">
            {activeTrack.name}
          </span>
          {isPlaying && (
            <span className="flex gap-0.5 items-end h-3 flex-shrink-0">
              <span className="w-0.5 bg-tertiary rounded-full animate-[eq1_0.8s_ease_infinite]" style={{ height: "40%" }} />
              <span className="w-0.5 bg-tertiary rounded-full animate-[eq2_0.6s_ease_infinite]" style={{ height: "70%" }} />
              <span className="w-0.5 bg-tertiary rounded-full animate-[eq3_0.9s_ease_infinite]" style={{ height: "55%" }} />
              <span className="w-0.5 bg-tertiary rounded-full animate-[eq1_0.7s_ease_infinite]" style={{ height: "85%" }} />
            </span>
          )}
        </div>
      )}

      {/* Volume slider */}
      {activeTrack && (
        <div className="mx-4 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-on-surface-variant flex-shrink-0">
            volume_down
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onSetVolume(Number(e.target.value))}
            className="flex-1 h-1.5 accent-tertiary cursor-pointer"
          />
          <span className="material-symbols-outlined text-sm text-on-surface-variant flex-shrink-0">
            volume_up
          </span>
        </div>
      )}

      {/* Track list */}
      <div className="flex flex-col gap-1 px-4 sm:px-5 pb-2 max-h-52 overflow-y-auto">
        {playlist.length === 0 && (
          <p className="text-xs text-on-surface-variant text-center py-3">
            No tracks yet. Add one below.
          </p>
        )}
        {playlist.map((track) => {
          const isActive = track.id === activeTrackId;
          return (
            <div
              key={track.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all group ${
                isActive
                  ? "bg-tertiary/15 border border-tertiary/30"
                  : "hover:bg-surface-container-high border border-transparent"
              }`}
              onClick={() => onSelectTrack(track.id)}
            >
              <span
                className={`flex-shrink-0 material-symbols-outlined text-base ${
                  isActive && isPlaying
                    ? "text-tertiary"
                    : isActive
                      ? "text-tertiary/70"
                      : "text-on-surface-variant/40"
                }`}
              >
                {isActive && isPlaying ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
              <span
                className={`flex-1 text-sm truncate font-medium ${
                  isActive ? "text-on-surface" : "text-on-surface-variant"
                }`}
              >
                {track.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTrack(track.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all flex-shrink-0"
                title="Remove track"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add track */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-outline-variant/30 mt-1">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors mt-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add YouTube track
          </button>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Track name..."
              className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-tertiary/50 text-on-surface placeholder:text-on-surface-variant/60"
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="YouTube URL..."
              className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-tertiary/50 text-on-surface placeholder:text-on-surface-variant/60"
            />
            {addError && (
              <p className="text-[10px] text-error">{addError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-1.5 bg-tertiary text-on-tertiary rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                  setNewUrl("");
                  setAddError("");
                }}
                className="px-3 py-1.5 border border-outline-variant/60 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default MusicPanel;
