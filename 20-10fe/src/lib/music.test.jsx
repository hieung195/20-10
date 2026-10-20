import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import MusicPlayer from '../components/MusicPlayer'
import { pauseMusic, playMusic, resetMusicForTests, toggleMusic } from './music'

// Thẻ audio giả: đếm số thẻ được tạo và số lần play() — jsdom không phát nhạc
const audios = []
class FakeAudio {
  constructor() {
    this.paused = true
    this.muted = false
    this.currentTime = 0
    this.plays = 0
    this.listeners = {}
    this.resolvePlay = null
    this.manual = FakeAudio.manual
    audios.push(this)
  }

  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener) }

  fire(type) { (this.listeners[type] || []).forEach((listener) => listener()) }

  play() {
    this.plays += 1
    this.paused = false
    if (FakeAudio.blocked) {
      this.paused = true
      return Promise.reject(new DOMException('blocked', 'NotAllowedError'))
    }
    if (this.manual) return new Promise((resolve, reject) => { this.resolvePlay = resolve; this.rejectPlay = reject })
    this.fire('playing')
    return Promise.resolve()
  }

  pause() {
    if (this.paused) return
    this.paused = true
    // Như trình duyệt: dừng khi play() còn đang chờ thì play() bị huỷ
    this.rejectPlay?.(new DOMException('aborted', 'AbortError'))
    this.fire('pause')
  }
}

beforeEach(() => {
  audios.length = 0
  FakeAudio.blocked = false
  FakeAudio.manual = false
  vi.stubGlobal('Audio', FakeAudio)
  resetMusicForTests()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve() })
const renderPlayer = (path = '/') => render(<MemoryRouter initialEntries={[path]}><MusicPlayer /></MemoryRouter>)

test('tự phát khi mở trang và chỉ tạo một thẻ nhạc', async () => {
  renderPlayer()
  await flush()
  expect(screen.getByRole('button', { name: 'Tạm dừng nhạc' })).toBeTruthy()
  await act(() => playMusic())
  expect(audios).toHaveLength(1)
  expect(audios[0].plays).toBe(1)
})

test('trình duyệt chặn tự phát: tương tác đầu tiên sẽ bật nhạc', async () => {
  FakeAudio.blocked = true
  renderPlayer()
  await flush()
  expect(screen.getByRole('button', { name: 'Phát nhạc' })).toBeTruthy()
  FakeAudio.blocked = false
  fireEvent.pointerDown(document.body)
  await flush()
  expect(screen.getByRole('button', { name: 'Tạm dừng nhạc' })).toBeTruthy()
  expect(audios).toHaveLength(1)
})

test('bấm dừng nhạc được tôn trọng khi tương tác tiếp trên trang', async () => {
  renderPlayer()
  await flush()
  const button = screen.getByRole('button', { name: 'Tạm dừng nhạc' })
  fireEvent.pointerDown(button)
  fireEvent.click(button)
  fireEvent.pointerDown(document.body)
  await flush()
  expect(audios[0].paused).toBe(true)
  expect(audios[0].plays).toBe(1)
})

test('vào admin hoặc login thì nhạc dừng và nút ẩn', async () => {
  await act(() => playMusic())
  const view = renderPlayer('/admin')
  expect(audios[0].paused).toBe(true)
  expect(screen.queryByRole('button')).toBeNull()
  view.unmount()
  renderPlayer('/login')
  expect(screen.queryByRole('button')).toBeNull()
})

test('video có thể dừng nhạc qua bộ điều khiển dùng chung', async () => {
  renderPlayer()
  await flush()
  act(() => pauseMusic())
  expect(audios[0].paused).toBe(true)
  expect(screen.getByRole('button', { name: 'Phát nhạc' })).toBeTruthy()
})

test('nhạc tải xong sau khi bấm dừng sẽ không phát ngầm', async () => {
  FakeAudio.manual = true
  playMusic()
  const audio = audios[0]
  const resolve = audio.resolvePlay
  audio.rejectPlay = null
  toggleMusic()
  audio.paused = false
  await act(async () => { resolve(); await Promise.resolve(); await Promise.resolve() })
  expect(audio.paused).toBe(true)
})
