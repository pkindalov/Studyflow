import { useState } from "react";
import Pagination from "../../../shared/components/Pagination";
import { useLang } from "../../../shared/i18n/LangContext";

const TIMER_VISIBLE = 5;
const TIMER_PAGE_SIZE = 8;

const MusicPanel = function({ music }) {
  const { t } = useLang();
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [tracksPage, setTracksPage] = useState(0);

  return (
    <div className="w-full border-t border-outline-variant/30 pt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-tertiary">headphones</span>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex-1">{t.musicLabel}</span>
        {music.activeTrack && (
          <button
            onClick={music.togglePlay}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${music.isPlaying ? "bg-tertiary/20 text-tertiary hover:bg-tertiary/30" : "bg-tertiary text-on-tertiary hover:opacity-90"}`}
            aria-label={music.isPlaying ? t.pauseMusicTitle : t.playMusicTitle}
            title={music.isPlaying ? t.pauseMusicTitle : t.playMusicTitle}
          >
            <span className="material-symbols-outlined text-sm">{music.isPlaying ? "pause" : "play_arrow"}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {music.playlist.length === 0 && (
          <p className="text-xs text-on-surface-variant text-center py-2">{t.noTracksTimer}</p>
        )}
        {music.playlist.slice(0, TIMER_VISIBLE).map((track) => {
          const isActive = track.id === music.activeTrackId;
          return (
            <button
              key={track.id}
              onClick={() => music.selectTrack(track.id)}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-all ${isActive ? "bg-tertiary/15 border border-tertiary/30" : "hover:bg-surface-container-high border border-transparent"}`}
            >
              <span className={`material-symbols-outlined text-sm flex-shrink-0 ${isActive && music.isPlaying ? "text-tertiary" : isActive ? "text-tertiary/60" : "text-on-surface-variant/30"}`}>
                {isActive && music.isPlaying ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
              <span className={`text-xs truncate font-medium ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}>{track.name}</span>
            </button>
          );
        })}
        {music.playlist.length > TIMER_VISIBLE && (
          <button
            onClick={() => { setShowAllTracks(true); setTracksPage(0); }}
            className="w-full text-center py-1 text-xs text-tertiary hover:text-tertiary/80 font-semibold transition-colors"
          >
            {t.moreViewAll(music.playlist.length - TIMER_VISIBLE)}
          </button>
        )}
      </div>

      {showAllTracks && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="tracks-modal-title" className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="tracks-modal-title" className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-tertiary">headphones</span>
                {t.playlistLabel}
              </h2>
              <button onClick={() => setShowAllTracks(false)} className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all" aria-label={t.close}>
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {music.playlist.slice(tracksPage * TIMER_PAGE_SIZE, tracksPage * TIMER_PAGE_SIZE + TIMER_PAGE_SIZE).map((track) => {
                const isActive = track.id === music.activeTrackId;
                return (
                  <button
                    key={track.id}
                    onClick={() => { music.selectTrack(track.id); setShowAllTracks(false); }}
                    className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left transition-all ${isActive ? "bg-tertiary/15 border border-tertiary/30" : "hover:bg-surface-container-high border border-transparent"}`}
                  >
                    <span className={`material-symbols-outlined text-sm flex-shrink-0 ${isActive && music.isPlaying ? "text-tertiary" : isActive ? "text-tertiary/60" : "text-on-surface-variant/30"}`}>
                      {isActive && music.isPlaying ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                    <span className={`text-xs truncate font-medium ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}>{track.name}</span>
                  </button>
                );
              })}
            </div>
            <Pagination
              page={tracksPage}
              totalPages={Math.ceil(music.playlist.length / TIMER_PAGE_SIZE)}
              onPrev={() => setTracksPage((p) => p - 1)}
              onNext={() => setTracksPage((p) => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPanel;
