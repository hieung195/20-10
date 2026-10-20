import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { pauseMusic, playMusic, toggleMusic, useMusic } from '../lib/music'

// Nút bật/tắt nhạc nền. Nhạc là MỘT thẻ audio dùng chung (lib/music) — Face ID
// tự bật nhạc khi đưa bạn vào trang quà thì nút này cũng hiện "Tạm dừng" ngay.
function MusicPlayer() {
  const { pathname } = useLocation()
  const { playing, loading } = useMusic()
  const onAdmin = pathname.startsWith('/admin') || pathname === '/login'

  useEffect(() => {
    if (onAdmin) { pauseMusic(); return undefined }
    playMusic()
    const firstTouch = event => {
      if (event.target.closest?.('.music-player')) {
        document.removeEventListener('pointerdown', firstTouch)
        document.removeEventListener('keydown', firstTouch)
        return
      }
      playMusic()
      document.removeEventListener('pointerdown', firstTouch)
      document.removeEventListener('keydown', firstTouch)
    }
    document.addEventListener('pointerdown', firstTouch)
    document.addEventListener('keydown', firstTouch)
    return () => {
      document.removeEventListener('pointerdown', firstTouch)
      document.removeEventListener('keydown', firstTouch)
    }
  }, [onAdmin])

  if (onAdmin) return null
  const label = loading ? 'Đang tải…' : playing ? 'Tạm dừng' : 'Bật nhạc'
  return (
    <div className="music-player">
      <button
        type="button"
        className={`music-btn${playing ? ' is-playing' : ''}`}
        onClick={toggleMusic}
        aria-label={playing || loading ? 'Tạm dừng nhạc' : 'Phát nhạc'}
      >
        {/* Đĩa chỉ quay khi đang phát; lúc dừng/tải chỉ có nốt nhạc */}
        {playing
          ? <span className="music-disc" aria-hidden="true"><span /></span>
          : <span aria-hidden="true">♫</span>}
        <span className="music-label">{label}</span>
      </button>
    </div>
  )
}

export default MusicPlayer
