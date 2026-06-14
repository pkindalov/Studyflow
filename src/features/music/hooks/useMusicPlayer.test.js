import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMusicPlayer, extractVideoId } from './useMusicPlayer'
import { initYTPlayer, ytPlay, ytPause, ytCue, ytVolume } from '../services/youtubePlayer'

vi.mock('../services/youtubePlayer', () => ({
  initYTPlayer: vi.fn(),
  resetYTPlayer: vi.fn(),
  ytPlay: vi.fn(),
  ytPause: vi.fn(),
  ytCue: vi.fn(),
  ytVolume: vi.fn(),
}))

vi.mock('../../../shared/utils/id', () => ({
  generateId: vi.fn(() => 'new-id'),
}))

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  delete window.YT
})

// ── extractVideoId ────────────────────────────────────────────────────────────

describe('extractVideoId', () => {
  it('extracts id from standard youtube.com watch url', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk')).toBe('jfKfPfyJRdk')
  })

  it('extracts id from youtu.be short url', () => {
    expect(extractVideoId('https://youtu.be/jfKfPfyJRdk')).toBe('jfKfPfyJRdk')
  })

  it('extracts id from embed url', () => {
    expect(extractVideoId('https://www.youtube.com/embed/jfKfPfyJRdk')).toBe('jfKfPfyJRdk')
  })

  it('extracts id from youtu.be url with extra query params', () => {
    expect(extractVideoId('https://youtu.be/jfKfPfyJRdk?si=abc123')).toBe('jfKfPfyJRdk')
  })

  it('returns null for an invalid url', () => {
    expect(extractVideoId('not-a-url')).toBeNull()
  })

  it('returns null for a non-youtube url', () => {
    expect(extractVideoId('https://vimeo.com/123456')).toBeNull()
  })
})

// ── useMusicPlayer ────────────────────────────────────────────────────────────

// Helper: fire the YouTube state-change callback registered with initYTPlayer
const fireStateChange = (data) => {
  const onStateChange = initYTPlayer.mock.calls[0][0]
  act(() => onStateChange({ data }))
}

describe('initial state', () => {
  it('uses DEFAULT_PLAYLIST when nothing in localStorage', () => {
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.playlist).toHaveLength(3)
    expect(result.current.playlist[0].id).toBe('lofi-girl')
  })

  it('defaults volume to 70', () => {
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.volume).toBe(70)
  })

  it('defaults activeTrackId to null', () => {
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.activeTrackId).toBeNull()
  })

  it('defaults activeTrack to null', () => {
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.activeTrack).toBeNull()
  })

  it('hydrates playlist from localStorage', () => {
    const custom = [{ id: 'x', name: 'X', url: 'https://www.youtube.com/watch?v=abc' }]
    localStorage.setItem('music_playlist', JSON.stringify(custom))
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.playlist).toHaveLength(1)
    expect(result.current.playlist[0].id).toBe('x')
  })

  it('hydrates volume from localStorage', () => {
    localStorage.setItem('music_volume', '42')
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.volume).toBe(42)
  })

  it('hydrates activeTrackId from localStorage', () => {
    localStorage.setItem('music_active_track', 'lofi-girl')
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.activeTrackId).toBe('lofi-girl')
  })

  it('falls back to DEFAULT_PLAYLIST on corrupt localStorage JSON', () => {
    localStorage.setItem('music_playlist', '{corrupt}')
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.playlist).toHaveLength(3)
  })

  it('defaults volume to 70 when localStorage contains a non-numeric string', () => {
    localStorage.setItem('music_volume', 'abc')
    const { result } = renderHook(() => useMusicPlayer())
    expect(result.current.volume).toBe(70)
  })
})

// ── addTrack ──────────────────────────────────────────────────────────────────

describe('addTrack', () => {
  it('appends a new track to the end of the playlist', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.addTrack('My Track', 'https://www.youtube.com/watch?v=xyz'))
    expect(result.current.playlist).toHaveLength(4)
    expect(result.current.playlist[3]).toMatchObject({ id: 'new-id', name: 'My Track' })
  })

  it('returns the generated id', () => {
    const { result } = renderHook(() => useMusicPlayer())
    let id
    act(() => { id = result.current.addTrack('T', 'https://www.youtube.com/watch?v=x') })
    expect(id).toBe('new-id')
  })
})

// ── removeTrack ───────────────────────────────────────────────────────────────

describe('removeTrack', () => {
  it('removes a non-active track from the playlist', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.removeTrack('ghibli-piano'))
    expect(result.current.playlist.find((t) => t.id === 'ghibli-piano')).toBeUndefined()
    expect(result.current.playlist).toHaveLength(2)
  })

  it('does not change activeTrackId when removing a different track', () => {
    localStorage.setItem('music_active_track', 'lofi-girl')
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.removeTrack('ghibli-piano'))
    expect(result.current.activeTrackId).toBe('lofi-girl')
  })

  it('clears activeTrackId and pauses when removing the active track', () => {
    localStorage.setItem('music_active_track', 'lofi-girl')
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.removeTrack('lofi-girl'))
    expect(result.current.activeTrackId).toBeNull()
    expect(ytPause).toHaveBeenCalled()
  })
})

// ── selectTrack ───────────────────────────────────────────────────────────────

describe('selectTrack', () => {
  it('sets activeTrackId', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.selectTrack('ghibli-piano'))
    expect(result.current.activeTrackId).toBe('ghibli-piano')
  })

  it('moves the selected track to the front of the playlist', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.selectTrack('ghibli-piano'))
    expect(result.current.playlist[0].id).toBe('ghibli-piano')
  })

  it('does not reorder when track is already at front', () => {
    const { result } = renderHook(() => useMusicPlayer())
    const original = result.current.playlist.map((t) => t.id)
    act(() => result.current.selectTrack('lofi-girl'))
    expect(result.current.playlist.map((t) => t.id)).toEqual(original)
  })

  it('cues the video when activeTrackId changes', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.selectTrack('lofi-girl'))
    expect(ytCue).toHaveBeenCalledWith('jfKfPfyJRdk')
  })

  it('updates activeTrack to the selected track object', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.selectTrack('ghibli-piano'))
    expect(result.current.activeTrack?.id).toBe('ghibli-piano')
  })
})

// ── setVolume ─────────────────────────────────────────────────────────────────

describe('setVolume', () => {
  it('updates volume state', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.setVolume(50))
    expect(result.current.volume).toBe(50)
  })

  it('calls ytVolume with the new value', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.setVolume(50))
    expect(ytVolume).toHaveBeenCalledWith(50)
  })
})

// ── play / pause / togglePlay ─────────────────────────────────────────────────

describe('play and pause', () => {
  it('play calls ytPlay', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.play())
    expect(ytPlay).toHaveBeenCalled()
  })

  it('pause calls ytPause', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.pause())
    expect(ytPause).toHaveBeenCalled()
  })
})

describe('togglePlay', () => {
  it('calls ytPlay when not playing', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.togglePlay())
    expect(ytPlay).toHaveBeenCalled()
    expect(ytPause).not.toHaveBeenCalled()
  })

  it('calls ytPause when playing', () => {
    window.YT = { PlayerState: { PLAYING: 1 } }
    const { result } = renderHook(() => useMusicPlayer())
    fireStateChange(1) // drive isPlaying → true
    act(() => result.current.togglePlay())
    expect(ytPause).toHaveBeenCalled()
  })
})

// ── clearPlaybackError ────────────────────────────────────────────────────────

describe('clearPlaybackError', () => {
  it('resets playbackError to null', () => {
    window.YT = { PlayerState: { PLAYING: 1 } }
    const { result } = renderHook(() => useMusicPlayer())
    const onError = initYTPlayer.mock.calls[0][1]
    act(() => onError(150)) // simulate a playback error
    expect(result.current.playbackError).not.toBeNull()
    act(() => result.current.clearPlaybackError())
    expect(result.current.playbackError).toBeNull()
  })
})

// ── localStorage persistence ──────────────────────────────────────────────────

describe('localStorage persistence', () => {
  it('persists playlist changes', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.addTrack('New', 'https://www.youtube.com/watch?v=abc'))
    const stored = JSON.parse(localStorage.getItem('music_playlist'))
    expect(stored).toHaveLength(4)
  })

  it('persists volume changes', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.setVolume(33))
    expect(localStorage.getItem('music_volume')).toBe('33')
  })

  it('persists activeTrackId when set', () => {
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.selectTrack('lofi-girl'))
    expect(localStorage.getItem('music_active_track')).toBe('lofi-girl')
  })

  it('removes music_active_track from storage when activeTrackId becomes null', () => {
    localStorage.setItem('music_active_track', 'lofi-girl')
    const { result } = renderHook(() => useMusicPlayer())
    act(() => result.current.removeTrack('lofi-girl'))
    expect(localStorage.getItem('music_active_track')).toBeNull()
  })
})
