import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  initYTPlayer, resetYTPlayer,
  ytPlay, ytPause, ytCue, ytLoad, ytVolume, ytReady,
} from './youtubePlayer'

const CONTAINER_ID = 'studyflow-yt-player'

const mkPlayer = () => ({
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  cueVideoById: vi.fn(),
  loadVideoById: vi.fn(),
  setVolume: vi.fn(),
  destroy: vi.fn(),
})

// YT.Player is called with `new`, so the mock implementation must be a regular
// function (not an arrow function — arrow functions cannot be constructors).
const mkConstructor = (impl) => vi.fn(function (...args) { impl?.(...args) })

beforeEach(() => {
  resetYTPlayer()
  delete window.YT
  delete window.onYouTubeIframeAPIReady
  document.querySelectorAll('script[src*="youtube.com"]').forEach((s) => s.remove())
})

// ── container creation ─────────────────────────────────────────────────────────

describe('container creation', () => {
  it('creates a div with the correct id when YT is already available', () => {
    window.YT = { Player: mkConstructor() }
    initYTPlayer(vi.fn())
    expect(document.getElementById(CONTAINER_ID)).not.toBeNull()
  })

  it('positions the container off-screen', () => {
    window.YT = { Player: mkConstructor() }
    initYTPlayer(vi.fn())
    const el = document.getElementById(CONTAINER_ID)
    expect(el.style.position).toBe('fixed')
    expect(el.style.top).toBe('-9999px')
    expect(el.style.left).toBe('-9999px')
  })

  it('reuses an existing container instead of creating a duplicate', () => {
    const existing = document.createElement('div')
    existing.id = CONTAINER_ID
    document.body.appendChild(existing)
    window.YT = { Player: mkConstructor() }
    initYTPlayer(vi.fn())
    expect(document.querySelectorAll(`#${CONTAINER_ID}`).length).toBe(1)
  })
})

// ── initYTPlayer — YT already loaded ──────────────────────────────────────────

describe('initYTPlayer when window.YT.Player already exists', () => {
  it('creates a YT.Player immediately', () => {
    const Player = mkConstructor()
    window.YT = { Player }
    initYTPlayer(vi.fn())
    expect(Player).toHaveBeenCalledTimes(1)
  })

  it('passes the container id to YT.Player', () => {
    const Player = mkConstructor()
    window.YT = { Player }
    initYTPlayer(vi.fn())
    expect(Player).toHaveBeenCalledWith(CONTAINER_ID, expect.any(Object))
  })

  it('passes correct playerVars (autoplay:0, controls:0)', () => {
    const Player = mkConstructor()
    window.YT = { Player }
    initYTPlayer(vi.fn())
    const cfg = Player.mock.calls[0][1]
    expect(cfg.playerVars.autoplay).toBe(0)
    expect(cfg.playerVars.controls).toBe(0)
  })

  it('is idempotent — calling twice only creates the player once', () => {
    const Player = mkConstructor()
    window.YT = { Player }
    initYTPlayer(vi.fn())
    initYTPlayer(vi.fn())
    expect(Player).toHaveBeenCalledTimes(1)
  })

  it('updates stateCallback on a second call even though player is not re-created', () => {
    const first = vi.fn()
    const second = vi.fn()
    let capturedCfg
    const Player = mkConstructor((id, cfg) => { capturedCfg = cfg })
    window.YT = { Player }
    initYTPlayer(first)
    initYTPlayer(second)
    capturedCfg.events.onStateChange({ data: 5 })
    expect(second).toHaveBeenCalledWith({ data: 5 })
    expect(first).not.toHaveBeenCalled()
  })
})

// ── initYTPlayer — YT not yet loaded ──────────────────────────────────────────

describe('initYTPlayer when window.YT is not available', () => {
  it('injects a YouTube IFrame API script tag into the document', () => {
    initYTPlayer(vi.fn())
    const script = document.querySelector('script[src*="youtube.com/iframe_api"]')
    expect(script).not.toBeNull()
  })

  it('does not add a duplicate script tag if one already exists', () => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    initYTPlayer(vi.fn())
    expect(document.querySelectorAll('script[src*="youtube.com/iframe_api"]').length).toBe(1)
  })

  it('sets window.onYouTubeIframeAPIReady', () => {
    initYTPlayer(vi.fn())
    expect(typeof window.onYouTubeIframeAPIReady).toBe('function')
  })

  it('chains with an existing onYouTubeIframeAPIReady handler', () => {
    const prev = vi.fn()
    window.onYouTubeIframeAPIReady = prev
    initYTPlayer(vi.fn())
    window.YT = { Player: mkConstructor() }
    window.onYouTubeIframeAPIReady()
    expect(prev).toHaveBeenCalled()
  })

  it('creates YT.Player when onYouTubeIframeAPIReady is eventually called', () => {
    initYTPlayer(vi.fn())
    const Player = mkConstructor()
    window.YT = { Player }
    window.onYouTubeIframeAPIReady()
    expect(Player).toHaveBeenCalledTimes(1)
  })
})

// ── event callbacks ────────────────────────────────────────────────────────────

describe('event callbacks', () => {
  it('fires onStateChange when the player state changes', () => {
    const onStateChange = vi.fn()
    const Player = mkConstructor((id, cfg) => cfg.events.onStateChange({ data: 1 }))
    window.YT = { Player }
    initYTPlayer(onStateChange)
    expect(onStateChange).toHaveBeenCalledWith({ data: 1 })
  })

  it('fires onError with e.data (not the raw event object)', () => {
    const onError = vi.fn()
    const Player = mkConstructor((id, cfg) => cfg.events.onError({ data: 150 }))
    window.YT = { Player }
    initYTPlayer(vi.fn(), onError)
    expect(onError).toHaveBeenCalledWith(150)
  })

  it('does not throw when onError is omitted and an error fires', () => {
    const Player = mkConstructor((id, cfg) => {
      expect(() => cfg.events.onError({ data: 100 })).not.toThrow()
    })
    window.YT = { Player }
    initYTPlayer(vi.fn())
  })
})

// ── ytReady ────────────────────────────────────────────────────────────────────

describe('ytReady', () => {
  it('returns false before onReady fires', () => {
    window.YT = { Player: mkConstructor() }
    initYTPlayer(vi.fn())
    expect(ytReady()).toBe(false)
  })

  it('returns true after onReady fires', () => {
    const player = mkPlayer()
    const Player = mkConstructor((id, cfg) => cfg.events.onReady({ target: player }))
    window.YT = { Player }
    initYTPlayer(vi.fn())
    expect(ytReady()).toBe(true)
  })

  it('returns false again after resetYTPlayer', () => {
    const player = mkPlayer()
    const Player = mkConstructor((id, cfg) => cfg.events.onReady({ target: player }))
    window.YT = { Player }
    initYTPlayer(vi.fn())
    resetYTPlayer()
    expect(ytReady()).toBe(false)
  })
})

// ── command queuing ────────────────────────────────────────────────────────────

describe('command queuing', () => {
  it('queues a command when the player is not yet ready', () => {
    const player = mkPlayer()
    let readyFn
    const Player = mkConstructor((id, cfg) => { readyFn = cfg.events.onReady })
    window.YT = { Player }
    initYTPlayer(vi.fn())

    ytPlay()
    expect(player.playVideo).not.toHaveBeenCalled()

    readyFn({ target: player })
    expect(player.playVideo).toHaveBeenCalled()
  })

  it('flushes all queued commands on ready', () => {
    const player = mkPlayer()
    let readyFn
    const Player = mkConstructor((id, cfg) => { readyFn = cfg.events.onReady })
    window.YT = { Player }
    initYTPlayer(vi.fn())

    ytPlay()
    ytPause()
    ytVolume(50)

    readyFn({ target: player })
    expect(player.playVideo).toHaveBeenCalled()
    expect(player.pauseVideo).toHaveBeenCalled()
    expect(player.setVolume).toHaveBeenCalledWith(50)
  })

  it('executes commands immediately when the player is already ready', () => {
    const player = mkPlayer()
    const Player = mkConstructor((id, cfg) => cfg.events.onReady({ target: player }))
    window.YT = { Player }
    initYTPlayer(vi.fn())

    ytPlay()
    expect(player.playVideo).toHaveBeenCalled()
  })
})

// ── individual command functions ───────────────────────────────────────────────

describe('command functions', () => {
  let player

  beforeEach(() => {
    player = mkPlayer()
    const Player = mkConstructor((id, cfg) => cfg.events.onReady({ target: player }))
    window.YT = { Player }
    initYTPlayer(vi.fn())
  })

  it('ytPlay calls playVideo on the player', () => {
    ytPlay()
    expect(player.playVideo).toHaveBeenCalled()
  })

  it('ytPause calls pauseVideo on the player', () => {
    ytPause()
    expect(player.pauseVideo).toHaveBeenCalled()
  })

  it('ytCue calls cueVideoById with the video id', () => {
    ytCue('abc123')
    expect(player.cueVideoById).toHaveBeenCalledWith('abc123')
  })

  it('ytLoad calls loadVideoById with the video id', () => {
    ytLoad('xyz789')
    expect(player.loadVideoById).toHaveBeenCalledWith('xyz789')
  })

  it('ytVolume calls setVolume with the given value', () => {
    ytVolume(75)
    expect(player.setVolume).toHaveBeenCalledWith(75)
  })
})

// ── resetYTPlayer ──────────────────────────────────────────────────────────────

describe('resetYTPlayer', () => {
  it('removes the container div from the DOM', () => {
    window.YT = { Player: mkConstructor() }
    initYTPlayer(vi.fn())
    expect(document.getElementById(CONTAINER_ID)).not.toBeNull()
    resetYTPlayer()
    expect(document.getElementById(CONTAINER_ID)).toBeNull()
  })

  it('calls destroy on the player', () => {
    const player = mkPlayer()
    const Player = mkConstructor((id, cfg) => cfg.events.onReady({ target: player }))
    window.YT = { Player }
    initYTPlayer(vi.fn())
    resetYTPlayer()
    expect(player.destroy).toHaveBeenCalled()
  })

  it('does not throw when there is no active player', () => {
    expect(() => resetYTPlayer()).not.toThrow()
  })

  it('does not throw when player.destroy() throws', () => {
    const player = { ...mkPlayer(), destroy: vi.fn(() => { throw new Error('fail') }) }
    const Player = mkConstructor((id, cfg) => cfg.events.onReady({ target: player }))
    window.YT = { Player }
    initYTPlayer(vi.fn())
    expect(() => resetYTPlayer()).not.toThrow()
  })

  it('allows re-initialization after reset', () => {
    const Player = mkConstructor()
    window.YT = { Player }
    initYTPlayer(vi.fn())
    resetYTPlayer()
    initYTPlayer(vi.fn())
    expect(Player).toHaveBeenCalledTimes(2)
  })
})
