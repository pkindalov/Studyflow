import { useState, useEffect, useCallback } from "react";
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
    // Not a valid URL
    console.error("Not a valid URL");
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

  const [activeTrackId, setActiveTrackId] = useState(
    () => localStorage.getItem("music_active_track") || null,
  );

  const [isPlaying, setIsPlaying] = useState(false);

  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem("music_volume");
    return saved !== null ? Number(saved) : 70;
  });

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

  // Init the YouTube player — the service manages its own DOM element
  useEffect(() => {
    initYTPlayer((e) => {
      if (typeof window.YT?.PlayerState !== "undefined") {
        setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
      }
    });
    ytVolume(volume);
    return resetYTPlayer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When active track changes: cue the new video (don't auto-play)
  useEffect(() => {
    if (!activeTrackId) return;
    const track = playlist.find((t) => t.id === activeTrackId);
    const videoId = track ? extractVideoId(track.url) : null;
    if (videoId) ytCue(videoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const id = crypto.randomUUID();
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

  const activeTrack = playlist.find((t) => t.id === activeTrackId) || null;

  return {
    playlist,
    activeTrackId,
    activeTrack,
    isPlaying,
    volume,
    play,
    pause,
    togglePlay,
    setVolume,
    selectTrack,
    addTrack,
    removeTrack,
  };
}
