import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Petals from '../components/paper/Petals'
import Stamp from '../components/paper/Stamp'
import '../styles/family.css'

export default function FamilyLandingPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  function openLetter(event) {
    event.preventDefault()
    if (name.trim().length < 2) { setError('Nhập tên hoặc cách gọi trong nhà, ít nhất 2 ký tự nhé.'); return }
    navigate(`/celebrate/${encodeURIComponent(name.trim().normalize('NFC'))}`)
  }
  return <main className="family-home family-home--memories page-paper">
    <Petals count={5} />
    <div className="family-memory-wall" aria-label="Những khoảnh khắc của gia đình">
      {[
        { file: 'ben-nhau', caption: 'Bên nhau là nhà', alt: 'Gia đình quây quần bên những chậu hoa vàng' },
        { file: 'nha-minh', caption: 'Nhà mình, thương lắm', alt: 'Cả gia đình cùng chụp ảnh trong một ngày sum họp' },
        { file: 'ngay-vui', caption: 'Giữ lại những ngày vui', alt: 'Gia đình cùng nhau trong ngày cưới' },
      ].map((photo, index) => <figure className={`family-memory family-memory--${index + 1}`} key={photo.file}>
        <span className="family-memory__tape" aria-hidden="true" />
        <a href={`/family-photos/${photo.file}.jpg`} target="_blank" rel="noreferrer" aria-label={`Xem ảnh: ${photo.caption}`}><img src={`/family-photos/${photo.file}.jpg`} alt={photo.alt} width="1400" height={index === 0 ? '810' : index === 1 ? '1050' : '933'} decoding="async" /></a>
        <figcaption>{photo.caption}</figcaption>
      </figure>)}
    </div>
    <section className="family-intro">
      <p className="family-eyebrow">20 tháng 10 · Gửi những người thương</p>
      <h1>Một mái nhà.<br /><em>Thật nhiều yêu thương.</em></h1>
      <p>Có những lời thương vẫn để trong lòng.<br />Hôm nay, gửi thành một lá thư.</p>
      <div className="family-dedication"><span aria-hidden="true">♡</span> Dành cho mẹ và những người thân yêu trong gia đình.</div>
    </section>
    <section className="family-envelope" aria-labelledby="letter-title">
      <span className="tape tape--center" aria-hidden="true" />
      <div className="family-envelope__top"><span>Thư nhà, gửi bằng cả trái tim</span><Stamp inline rotate={7} /></div>
      <h2 id="letter-title">Có một lá thư dành riêng cho mình</h2>
      <p>Nhập tên hoặc cách mọi người vẫn gọi trong nhà để mở lời chúc nhé.</p>
      <form onSubmit={openLetter} className="family-form">
        <label htmlFor="family-name">Gửi đến</label>
        <input id="family-name" value={name} onChange={event => { setName(event.target.value); setError('') }} maxLength={100} placeholder="Ví dụ: mẹ, Yến, bà ngoại, chị Lan…" autoComplete="name" required aria-invalid={Boolean(error)} aria-describedby={error ? 'name-error' : undefined} />
        {error && <p id="name-error" role="alert">{error}</p>}
        <button className="btn-ink" type="submit">Mở lá thư của mình <span aria-hidden="true">→</span></button>
      </form>
      <p className="family-note">Mỗi cái tên là một người thương. Mỗi lá thư là một lời trân trọng.</p>
    </section>
  </main>
}
