import { useState, useEffect, useCallback, useRef } from "react";
import { generateId } from "../../../shared/utils/id";
import {
  initYTPlayer,
  resetYTPlayer,
  ytPlay,
  ytPause,
  ytCue,
  ytVolume,
} from "../services/youtubePlayer";


const DEFAULT_PLAYLIST = [
  {
    id: "lofi-girl",
    name: "Lo-Fi Girl 24/7",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
  },
  {
    id: "ghibli-piano",
    name: "Studio Ghibli Piano",
    url: "https://www.youtube.com/watch?v=NPxIlQkE3G8",
  },
  {
    id: "ghibli-relaxing",
    name: "Ghibli Relaxing Mix",
    url: "https://www.youtube.com/watch?v=dT3LTe_zRvk",
  },
];

export function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function useMusicPlayer() {
  const [playlist, setPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem("music_playlist");
      return saved ? JSON.parse(saved) : DEFAULT_PLAYLIST;
    } catch {
      return DEFAULT_PLAYLIST;
    }
  });

  const playlistRef = useRef(playlist);

  const [activeTrackId, setActiveTrackId] = useState(
    () => localStorage.getItem("music_active_track") || null,
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(null); // { code, trackId }

  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem("music_volume");
    if (saved === null) return 70;
    const parsed = Number(saved);
    return isNaN(parsed) ? 70 : parsed;
  });
  // Capture the initial volume so the player-init effect can read it without
  // listing `volume` as a dependency (which would re-init the player on every
  // volume change).
  const initialVolumeRef = useRef(volume);
  // Persist playlist
  useEffect(() => {
    localStorage.setItem("music_playlist", JSON.stringify(playlist));
  }, [playlist]);

  // Persist active track
  useEffect(() => {
    if (activeTrackId)
      localStorage.setItem("music_active_track", activeTrackId);
    else localStorage.removeItem("music_active_track");
  }, [activeTrackId]);

  // Persist volume
  useEffect(() => {
    localStorage.setItem("music_volume", String(volume));
  }, [volume]);

  // Init the YouTube player — the service manages its own DOM element.
  // `volume` is captured from the useState initializer at mount, so its value
  // is identical to what the redundant localStorage read would have produced.
  useEffect(() => {
    initYTPlayer(
      (e) => {
        if (typeof window.YT?.PlayerState !== "undefined") {
          setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
        }
      },
      (code) => {
        setActiveTrackId((currentId) => {
          setPlaybackError({ code, trackId: currentId });
          return currentId;
        });
        setIsPlaying(false);
      },
    );
    ytVolume(initialVolumeRef.current);
    return resetYTPlayer;
  }, []);

  // Keep a ref to the latest playlist so the cue effect can look up a track's URL
  // without re-cueing every time the playlist is reordered or edited.
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  // When the active track changes: cue the new video (don't auto-play). Clearing a
  // prior playback error happens in selectTrack, where the user drives the change.
  useEffect(() => {
    if (!activeTrackId) return;
    const track = playlistRef.current.find((t) => t.id === activeTrackId);
    const videoId = track ? extractVideoId(track.url) : null;
    if (videoId) ytCue(videoId);
  }, [activeTrackId]);

  // play() resumes whatever is cued — does NOT restart the track
  const play = useCallback(() => {
    ytPlay();
  }, []);

  const pause = useCallback(() => {
    ytPause();
  }, []);

  const togglePlay = useCallback(() => {
    // Read the latest isPlaying inside functional form via the ref trick isn't
    // needed here — togglePlay is recreated whenever isPlaying changes.
    if (isPlaying) ytPause();
    else ytPlay();
  }, [isPlaying]);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    ytVolume(v);
  }, []);

  const selectTrack = useCallback((id) => {
    setPlaybackError(null);
    setActiveTrackId(id);
    setPlaylist((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
  }, []);

  const addTrack = useCallback((name, url) => {
    const id = generateId();
    setPlaylist((prev) => [...prev, { id, name, url }]);
    return id;
  }, []);

  const removeTrack = useCallback((id) => {
    setActiveTrackId((prev) => {
      if (prev === id) {
        ytPause();
        return null;
      }
      return prev;
    });
    setPlaylist((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearPlaybackError = useCallback(() => setPlaybackError(null), []);

  const activeTrack = playlist.find((t) => t.id === activeTrackId) || null;

  return {
    playlist,
    activeTrackId,
    activeTrack,
    isPlaying,
    volume,
    playbackError,
    play,
    pause,
    togglePlay,
    setVolume,
    selectTrack,
    addTrack,
    removeTrack,
    clearPlaybackError,
  };
}
