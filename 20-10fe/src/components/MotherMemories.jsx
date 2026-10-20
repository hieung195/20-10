import { Fragment } from 'react'
import { pauseMusic } from '../lib/music'
import '../styles/mother-memories.css'

const memories = [
  'Thêm một tuổi, thêm yêu thương',
  'Nụ cười con thương',
  'Nhà là khi mình bên nhau',
  'Những ngày thật ấm',
  'Bên mẹ, con vẫn bé',
  'Giữ lại một ngày vui',
  'Mẹ cứ vui như thế nhé',
  'Đi đâu cũng có mẹ',
  'Bình yên là có nhau',
]
function PhotoGroup({ start }) {
  return <div className="mother-memory-group" aria-label="Những tấm ảnh kỷ niệm của mẹ">
    {memories.slice(start, start + 3).map((caption, index) => {
      const number = start + index + 1
      return <figure className={`mother-memory mother-memory--${index + 1}`} key={number}>
        <span className="mother-memory-tape" aria-hidden="true" />
        <a href={`/mother-memories/memory-${number}.jpg`} target="_blank" rel="noreferrer" aria-label={`Xem ảnh lớn: ${caption}`}>
          <img src={`/mother-memories/memory-${number}.jpg`} alt={caption} loading="lazy" decoding="async" />
        </a>
        <figcaption>{caption}</figcaption>
      </figure>
    })}
  </div>
}
export default function MotherMemories({ greeting }) {
  const paragraphs = greeting.split(/\n\s*\n/).filter(Boolean)
  // Spread all three sets through the letter, including when admin changes its length.
  const after = [0.25, 0.6, 1].map(fraction => Math.max(0, Math.ceil(paragraphs.length * fraction) - 1))
  return <div className="family-letter__body mother-letter-body">
    {paragraphs.map((paragraph, index) => <Fragment key={index}>
      <p>{paragraph}</p>
      {after.map((position, group) => position === index ? <PhotoGroup key={group} start={group * 3} /> : null)}
    </Fragment>)}
    <figure className="mother-memory-video">
      <span className="mother-memory-tape" aria-hidden="true" />
      <video controls playsInline preload="none" poster="/mother-memories/video-poster.jpg" onPlay={pauseMusic} aria-label="Một đoạn video kỷ niệm dành cho mẹ">
        <source src="/mother-memories/memory-video.mp4" type="video/mp4" />
        Trình duyệt chưa hỗ trợ video. <a href="/mother-memories/memory-video.mp4">Mở video kỷ niệm</a>.
      </video>
      <figcaption>Có những khoảnh khắc, con muốn giữ mãi.</figcaption>
    </figure>
  </div>
}
