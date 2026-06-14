import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import MusicPanel from './MusicPanel'

// Control URL validation from tests
const mockExtractVideoId = vi.fn()
vi.mock('../hooks/useMusicPlayer', () => ({
  extractVideoId: (...args) => mockExtractVideoId(...args),
}))

vi.mock('../../../shared/components/Pagination', () => ({
  default: () => null,
}))

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const makeTrack = (id, name) => ({ id, name })

let onSelectTrack, onAddTrack, onRemoveTrack, onTogglePlay, onSetVolume, onClearPlaybackError

beforeEach(() => {
  onSelectTrack = vi.fn()
  onAddTrack = vi.fn()
  onRemoveTrack = vi.fn()
  onTogglePlay = vi.fn()
  onSetVolume = vi.fn()
  onClearPlaybackError = vi.fn()
  mockExtractVideoId.mockReset()
  localStorage.clear()
})

const baseProps = (overrides = {}) => ({
  playlist: [],
  activeTrackId: null,
  activeTrack: null,
  isPlaying: false,
  volume: 70,
  playbackError: null,
  onSelectTrack,
  onAddTrack,
  onRemoveTrack,
  onTogglePlay,
  onSetVolume,
  onClearPlaybackError,
  ...overrides,
})

describe('header', () => {
  it('shows the Focus Music heading', () => {
    wrap(<MusicPanel {...baseProps()} />)
    expect(screen.getByText('Focus Music')).toBeTruthy()
  })

  it('shows play button only when an active track is set', () => {
    const activeTrack = makeTrack('t1', 'Lo-Fi')
    wrap(<MusicPanel {...baseProps({ activeTrack, activeTrackId: 't1', playlist: [activeTrack] })} />)
    expect(screen.getByTitle('Play music')).toBeTruthy()
  })

  it('hides play button when no active track', () => {
    wrap(<MusicPanel {...baseProps()} />)
    expect(screen.queryByTitle('Play music')).toBeNull()
    expect(screen.queryByTitle('Pause music')).toBeNull()
  })

  it('calls onTogglePlay when header play button is clicked', () => {
    const activeTrack = makeTrack('t1', 'Lo-Fi')
    wrap(<MusicPanel {...baseProps({ activeTrack, activeTrackId: 't1', playlist: [activeTrack] })} />)
    fireEvent.click(screen.getByTitle('Play music'))
    expect(onTogglePlay).toHaveBeenCalledOnce()
  })
})

describe('track list', () => {
  it('shows empty-state message when playlist is empty', () => {
    wrap(<MusicPanel {...baseProps()} />)
    expect(screen.getByText('No tracks yet. Add one below.')).toBeTruthy()
  })

  it('renders track names', () => {
    const playlist = [makeTrack('t1', 'Lo-Fi Beats'), makeTrack('t2', 'Jazz Focus')]
    wrap(<MusicPanel {...baseProps({ playlist })} />)
    expect(screen.getByText('Lo-Fi Beats')).toBeTruthy()
    expect(screen.getByText('Jazz Focus')).toBeTruthy()
  })

  it('calls onSelectTrack when a track row is clicked', () => {
    const playlist = [makeTrack('t1', 'Lo-Fi Beats')]
    wrap(<MusicPanel {...baseProps({ playlist })} />)
    fireEvent.click(screen.getByText('Lo-Fi Beats'))
    expect(onSelectTrack).toHaveBeenCalledWith('t1')
  })

  it('shows "view all" button when playlist exceeds 5 tracks', () => {
    const playlist = Array.from({ length: 6 }, (_, i) => makeTrack(`t${i}`, `Track ${i}`))
    wrap(<MusicPanel {...baseProps({ playlist })} />)
    expect(screen.getByText('+1 more — view all')).toBeTruthy()
  })

  it('opens the playlist modal when "view all" is clicked', () => {
    const playlist = Array.from({ length: 6 }, (_, i) => makeTrack(`t${i}`, `Track ${i}`))
    wrap(<MusicPanel {...baseProps({ playlist })} />)
    fireEvent.click(screen.getByText('+1 more — view all'))
    expect(screen.getByRole('heading', { name: 'Playlist' })).toBeTruthy()
  })

  it('closes the playlist modal when the close button is clicked', () => {
    const playlist = Array.from({ length: 6 }, (_, i) => makeTrack(`t${i}`, `Track ${i}`))
    wrap(<MusicPanel {...baseProps({ playlist })} />)
    fireEvent.click(screen.getByText('+1 more — view all'))
    fireEvent.click(screen.getByRole('button', { name: 'Close playlist' }))
    expect(screen.queryByRole('heading', { name: 'Playlist' })).toBeNull()
  })

  it('remove button has an accessible label', () => {
    const playlist = [makeTrack('t1', 'Lo-Fi Beats')]
    wrap(<MusicPanel {...baseProps({ playlist })} />)
    expect(screen.getByRole('button', { name: 'Remove track' })).toBeTruthy()
  })
})

describe('volume slider', () => {
  it('shows volume slider when active track is set', () => {
    const activeTrack = makeTrack('t1', 'Lo-Fi')
    wrap(<MusicPanel {...baseProps({ activeTrack, activeTrackId: 't1', playlist: [activeTrack] })} />)
    expect(screen.getByRole('slider')).toBeTruthy()
  })

  it('hides volume slider when no active track', () => {
    wrap(<MusicPanel {...baseProps()} />)
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('calls onSetVolume when slider changes', () => {
    const activeTrack = makeTrack('t1', 'Lo-Fi')
    wrap(<MusicPanel {...baseProps({ activeTrack, activeTrackId: 't1', playlist: [activeTrack] })} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '50' } })
    expect(onSetVolume).toHaveBeenCalledWith(50)
  })
})

describe('playback error', () => {
  it('shows error banner when playbackError is set', () => {
    const playbackError = { trackId: 't1', message: 'error' }
    wrap(<MusicPanel {...baseProps({ playbackError })} />)
    expect(screen.getByText("This track can't be played (embedding restricted or unavailable). Try a different video.")).toBeTruthy()
  })

  it('hides error banner when playbackError is null', () => {
    wrap(<MusicPanel {...baseProps()} />)
    expect(screen.queryByTitle('Dismiss')).toBeNull()
  })

  it('calls onClearPlaybackError when dismiss is clicked', () => {
    const playbackError = { trackId: 't1', message: 'error' }
    wrap(<MusicPanel {...baseProps({ playbackError })} />)
    fireEvent.click(screen.getByTitle('Dismiss'))
    expect(onClearPlaybackError).toHaveBeenCalledOnce()
  })
})

describe('add track form', () => {
  it('shows add-track link initially', () => {
    wrap(<MusicPanel {...baseProps()} />)
    expect(screen.getByText('Add YouTube track')).toBeTruthy()
  })

  it('shows name and URL inputs when add link is clicked', () => {
    wrap(<MusicPanel {...baseProps()} />)
    fireEvent.click(screen.getByText('Add YouTube track'))
    expect(screen.getByPlaceholderText('Track name...')).toBeTruthy()
    expect(screen.getByPlaceholderText('YouTube URL...')).toBeTruthy()
  })

  it('shows error when submitting without a name', () => {
    mockExtractVideoId.mockReturnValue('vid-id')
    wrap(<MusicPanel {...baseProps()} />)
    fireEvent.click(screen.getByText('Add YouTube track'))
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText('Please enter a track name.')).toBeTruthy()
  })

  it('shows error when URL is invalid', () => {
    mockExtractVideoId.mockReturnValue(null)
    wrap(<MusicPanel {...baseProps()} />)
    fireEvent.click(screen.getByText('Add YouTube track'))
    fireEvent.change(screen.getByPlaceholderText('Track name...'), { target: { value: 'My Track' } })
    fireEvent.change(screen.getByPlaceholderText('YouTube URL...'), { target: { value: 'not-a-url' } })
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText('Invalid YouTube URL.')).toBeTruthy()
  })

  it('calls onAddTrack when valid name and URL are provided', () => {
    mockExtractVideoId.mockReturnValue('dQw4w9WgXcQ')
    wrap(<MusicPanel {...baseProps()} />)
    fireEvent.click(screen.getByText('Add YouTube track'))
    fireEvent.change(screen.getByPlaceholderText('Track name...'), { target: { value: 'My Track' } })
    fireEvent.change(screen.getByPlaceholderText('YouTube URL...'), { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    fireEvent.click(screen.getByText('Add'))
    expect(onAddTrack).toHaveBeenCalledWith('My Track', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('hides form and resets fields when Cancel is clicked', () => {
    wrap(<MusicPanel {...baseProps()} />)
    fireEvent.click(screen.getByText('Add YouTube track'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('Track name...')).toBeNull()
    expect(screen.getByText('Add YouTube track')).toBeTruthy()
  })
})
