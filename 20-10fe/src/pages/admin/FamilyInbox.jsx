import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminAuth } from '../../api/adminApi'
import '../../styles/celebration.css'
import '../../styles/family.css'
import '../../styles/family-admin.css'

const blank = { keywords: '', recipient: '', title: '', signature: '', greeting: '' }
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const imageSource = url => url.startsWith('http') ? url : `${base}${url}`
async function request(path, body, method) {
  const response = await fetch(`${base}/api/admin/${path}`, { method: method || (body ? 'POST' : 'GET'), headers: { Authorization: `Bearer ${adminAuth.getToken()}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message || 'Không tải được dữ liệu')
  return payload.data
}
async function fetchAll() {
  const [overview, feedback, greetings, images] = await Promise.all([request('overview'), request('feedback'), request('greetings'), request('images')])
  return { overview, feedback, greetings, images }
}
const tabs = [
  { id: 'overview', label: 'Tổng quan', description: 'Những con số nhỏ, những kết nối yêu thương.', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z' },
  { id: 'responses', label: 'Phản hồi', description: 'Đọc những lời nhắn từ người thân.', icon: 'M3 5h18v14H3z M3 6l9 7 9-7' },
  { id: 'greetings', label: 'Lời chúc', description: 'Viết và chăm chút từng lời chúc dành riêng.', icon: 'M12 20H4V4h12 M14 6l4-4 4 4-12 12H6v-4z' },
  { id: 'images', label: 'Thư viện ảnh', description: 'Tất cả những khoảnh khắc đã được gửi về.', icon: 'M3 3h18v18H3z M3 17l6-6 5 5 3-3 4 4 M15 7h.01' },
]
function bytes(size) {
  if (!size) return '0 KB'
  return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`
}
function pageLabel(page) { try { return decodeURI(page) } catch { return page } }
export default function FamilyInbox() {
  const [params, setParams] = useSearchParams()
  const active = tabs.find(tab => tab.id === params.get('tab')) || tabs[0]
  const [menuOpen, setMenuOpen] = useState(false)
  function selectTab(id) { setParams({ tab: id }); setMenuOpen(false); window.scrollTo(0, 0) }
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState(blank)
  async function load() {
    setLoading(true); setError('')
    try { setData(await fetchAll()) } catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    let cancelled = false
    const refresh = () => fetchAll().then(result => { if (!cancelled) { setData(result); setError('') } }).catch(err => { if (!cancelled) setError(err.message) }).finally(() => { if (!cancelled) setLoading(false) })
    refresh()
    const timer = setInterval(refresh, 20000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])
  async function save(event) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('')
    try {
      await request('greetings', { ...form, keywords: form.keywords.split(/[,;\n]/).map(word => word.trim()).filter(Boolean) })
      setForm(blank); setMessage('Đã lưu lời chúc. Người thân nhập từ khóa sẽ nhận nội dung này.'); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  async function deleteFeedback(item) {
    if (!window.confirm(`Xóa phản hồi của ${item.recipient}? Phản hồi sẽ không còn hiển thị trên trang thư. Ảnh đã tải lên vẫn được giữ trong Thư viện ảnh.`)) return
    setDeleting(item.id); setError(''); setMessage('')
    try {
      await request(`feedback/${encodeURIComponent(item.id)}`, undefined, 'DELETE')
      setMessage('Đã xóa phản hồi.'); await load()
    } catch (err) { setError(err.message) } finally { setDeleting(null) }
  }
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }))
  return <div className="family-admin-shell page-paper">
    <aside className={`family-sidebar${menuOpen ? ' is-open' : ''}`}>
      <Link className="family-sidebar-brand" to="/admin"><img src="/family-heart.svg" alt="" /><span>Thư nhà<small>GÓC QUẢN TRỊ</small></span></Link>
      <button className="family-sidebar-toggle" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Đóng menu' : 'Mở menu'}</button>
      <nav id="admin-navigation" aria-label="Quản trị gia đình">{tabs.map(tab => <Link key={tab.id} to={`/admin?tab=${tab.id}`} aria-current={active.id === tab.id ? 'page' : undefined} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0) }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={tab.icon} /></svg>{tab.label}{tab.id === 'responses' && data && <span>{data.feedback.total}</span>}{tab.id === 'images' && data && <span>{data.images.total}</span>}</Link>)}</nav>
      <div className="family-sidebar-bottom"><p>Một mái nhà.<br />Thật nhiều yêu thương.</p><Link to="/">← Xem trang gia đình</Link><button onClick={() => { adminAuth.clear(); window.location.assign('/login') }}>Đăng xuất</button></div>
    </aside>
    <main className="family-admin-content">
      <header className="family-admin-header"><div><p className="family-eyebrow">THƯ NHÀ / QUẢN TRỊ</p><h1>{active.label}</h1><p>{active.description}</p></div><button className="btn-dashed" onClick={load} disabled={loading}>{loading ? 'Đang tải…' : 'Làm mới'}</button></header>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <section id="overview" className="family-admin-panel" hidden={active.id !== 'overview'}>
      <div className="family-stats"><div><strong>{data?.overview.feedbackCount ?? '—'}</strong><span>Phản hồi</span></div><div><strong>{data?.overview.visitCount ?? '—'}</strong><span>Lượt mở trang</span></div><div><strong>{data?.overview.visitors ?? '—'}</strong><span>Phiên truy cập</span></div><button className="family-stat-image" onClick={() => selectTab('images')}><strong>{data?.images.total ?? '—'}</strong><span>Ảnh đã lưu →</span></button></div>
      <h3>Vị trí người mở web</h3><p className="family-admin-hint">Vị trí gần đúng theo IP, không phải GPS. Truy cập trên máy này sẽ hiển thị mạng nội bộ. Mỗi lần mở hoặc chuyển trang được tính một lượt.</p>
      <div className="family-visits">{data?.overview.visits.map(visit => <article key={visit.id}><strong>{visit.location.label}</strong><time>{new Date(visit.createdAt).toLocaleString('vi-VN')}</time><small>{pageLabel(visit.page)}</small></article>)}</div>
    </section>
    <section id="responses" className="family-admin-panel" hidden={active.id !== 'responses'}><h2>Phản hồi từ người thân</h2>{data?.feedback.items.length === 0 && <p>Chưa có phản hồi.</p>}{data?.feedback.items.map(item => <article className="family-inbox-item" key={item.id}><div className="family-response-header"><h3>{item.recipient}</h3><button className="btn-dashed family-delete-button" type="button" disabled={deleting !== null} onClick={() => deleteFeedback(item)} aria-label={`Xóa phản hồi của ${item.recipient}`}>{deleting === item.id ? 'Đang xóa…' : 'Xóa phản hồi'}</button></div><time>{new Date(item.createdAt).toLocaleString('vi-VN')}</time><p>{item.content}</p><div className="family-feedback-images">{item.images?.map(url => <a key={url} href={imageSource(url)} target="_blank" rel="noreferrer"><img src={imageSource(url)} alt={`Ảnh từ ${item.recipient}`} loading="lazy" /></a>)}</div></article>)}</section>
    <section id="greetings" className="family-admin-panel" hidden={active.id !== 'greetings'}><h2>{form.id ? 'Cập nhật lời chúc' : 'Thêm lời chúc theo từ khóa'}</h2><form className="family-form" onSubmit={save}>
      <label htmlFor="rule-keywords">Từ khóa nhận biết (cách nhau bằng dấu phẩy)</label><input id="rule-keywords" value={form.keywords} onChange={event => field('keywords', event.target.value)} placeholder="Ví dụ: dì Hoa, hoa" required />
      <label htmlFor="rule-recipient">Tên hiển thị</label><input id="rule-recipient" value={form.recipient} onChange={event => field('recipient', event.target.value)} placeholder="Ví dụ: Dì Hoa" />
      <label htmlFor="rule-title">Tiêu đề</label><input id="rule-title" value={form.title} onChange={event => field('title', event.target.value)} />
      <label htmlFor="rule-content">Nội dung lời chúc</label><textarea id="rule-content" rows={8} value={form.greeting} onChange={event => field('greeting', event.target.value)} required />
      <label htmlFor="rule-signature">Chữ ký</label><input id="rule-signature" value={form.signature} onChange={event => field('signature', event.target.value)} />
      <button className="btn-ink" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu lời chúc'}</button>{form.id && <button type="button" className="btn-dashed" onClick={() => setForm(blank)}>Thêm lời chúc khác</button>}
    </form><div className="family-rules">{data?.greetings.items.map(rule => <article className="family-inbox-item" key={rule.id}><h3>{rule.recipient || rule.keywords.join(', ')}</h3><p>Từ khóa: {rule.keywords.join(', ')}</p><button className="btn-dashed" onClick={() => { setForm({ ...rule, keywords: rule.keywords.join(', ') }); document.getElementById('rule-keywords')?.focus() }}>Chỉnh sửa</button></article>)}</div></section>
    <section id="images" className="family-admin-panel" hidden={active.id !== 'images'}>
      <div className="family-gallery-summary"><h2>Ảnh hiện có</h2><span>{data?.images.total ?? 0} ảnh · {bytes(data?.images.totalBytes || 0)}</span></div>
      {data?.images.total === 0 && <div className="family-empty"><h3>Chưa có ảnh nào</h3><p>Ảnh người thân tải lên trong phản hồi sẽ được tập hợp tại đây.</p></div>}
      <div className="family-gallery">{data?.images.items.map(image => <article key={image.id}><a href={imageSource(image.url)} target="_blank" rel="noreferrer" aria-label={`Xem ảnh gốc từ ${image.recipient}`}><img src={imageSource(image.url)} alt={`Ảnh từ ${image.recipient}`} loading="lazy" /></a><div><h3>{image.recipient}</h3><p>{new Date(image.createdAt).toLocaleDateString('vi-VN')} · {bytes(image.size)}</p><a className="link-dashed" href={imageSource(image.url)} target="_blank" rel="noreferrer">Xem ảnh gốc ↗</a></div></article>)}</div>
    </section>
    </main></div>
}
