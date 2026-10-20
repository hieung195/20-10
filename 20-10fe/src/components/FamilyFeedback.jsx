import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { listFamilyFeedback, sendFamilyFeedback } from '../api/familyApi'

export default function FamilyFeedback({ name, recipient }) {
  const location = useLocation()
  const [sender, setSender] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const requestId = useRef(null)
  const jumpedToHash = useRef('')
  const fileInput = useRef(null)
  useEffect(() => {
    let cancelled = false
    const load = () => listFamilyFeedback(name).then(data => { if (!cancelled) { setItems(data.items); setListError('') } }).catch(() => { if (!cancelled) setListError('Chưa tải được lời nhắn. Đang thử kết nối lại…') })
    load()
    const timer = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [name])
  useEffect(() => {
    if (!location.hash || !items.length || jumpedToHash.current === location.hash) return
    const id = location.hash.slice(1)
    const target = document.getElementById(id)
    if (!target) return
    jumpedToHash.current = location.hash
    target.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [items, location.hash])
  async function submit(event) {
    event.preventDefault()
    if ((!content.trim() && !images.length) || status === 'sending') return
    requestId.current ||= crypto.randomUUID()
    setStatus('sending'); setError('')
    try {
      await sendFamilyFeedback({ name, sender: sender.trim(), content: content.trim(), requestId: requestId.current, files: images })
      setStatus('sent'); setSender(''); setContent(''); setImages([]); requestId.current = null
      if (fileInput.current) fileInput.current.value = ''
      try { setItems((await listFamilyFeedback(name)).items) } catch { setListError('Lời nhắn đã gửi. Đang chờ tải lại danh sách…') }
    } catch (err) { setError(err.message); setStatus('') }
  }
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  const imageSource = url => url.startsWith('http') ? url : `${base}${url}`
  return <section className="family-feedback" aria-labelledby="feedback-title">
    <h2 id="feedback-title">Những lời nhắn yêu thương</h2>
    {listError && <p role="status">{listError}</p>}
    {items.map(item => {
      const senderName = item.sender?.trim() || 'Người gửi không ghi tên'
      return <article className="family-inbox-item" id={`feedback-${item.id}`} key={item.id}><h3>{senderName}</h3><p>{item.content}</p><div className="family-feedback-images">{item.images?.map(image => { const url = typeof image === 'string' ? image : image.url; return <a key={url} href={imageSource(url)} target="_blank" rel="noreferrer"><img src={imageSource(url)} alt={`Ảnh trong lời nhắn từ ${senderName}`} loading="lazy" /></a> })}</div><time className="family-feedback__time" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN')}</time></article>
    })}
    <form className="family-form" onSubmit={submit}>
      <label htmlFor="family-sender">Tên người gửi</label>
      <input id="family-sender" value={sender} onChange={event => { setSender(event.target.value); requestId.current = null; setStatus('') }} maxLength={80} autoComplete="name" required disabled={status === 'sending'} placeholder="Ví dụ: Hùng, chị Ngọc…" />
      <label htmlFor="family-feedback">Lời nhắn của mình</label>
      <textarea id="family-feedback" value={content} onChange={event => { setContent(event.target.value); requestId.current = null; setStatus('') }} maxLength={2000} rows={4} disabled={status === 'sending'} placeholder="Viết vài dòng ở đây nhé…" aria-describedby="feedback-hint" />
      <small id="feedback-hint">{content.length}/2000 ký tự · Gửi từ {recipient}</small>
      <label htmlFor="family-images">Gửi kèm ảnh</label>
      <input ref={fileInput} id="family-images" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple disabled={status === 'sending'} onChange={event => { setImages(Array.from(event.target.files)); requestId.current = null; setStatus('') }} />
      <small>{images.length ? `Đã chọn ${images.length} ảnh: ${images.map(image => image.name).join(', ')}` : 'Có thể chọn nhiều ảnh; ảnh sẽ được lưu cùng lời nhắn.'}</small>
      {error && <p role="alert">{error}</p>}
      {status === 'sent' && <p role="status" className="family-feedback__success">Đã gửi lời nhắn và ảnh!</p>}
      <button className="btn-ink" type="submit" disabled={status === 'sending' || !sender.trim() || (!content.trim() && !images.length)}>{status === 'sending' ? 'Đang gửi ảnh và lời nhắn…' : 'Gửi phản hồi'}</button>
    </form>
  </section>
}
