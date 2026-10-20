import { Link } from 'react-router-dom'
import '../styles/family.css'
export default function NotFoundPage() {
  return <main className="family-letter page-paper"><section className="family-envelope"><h1>Không tìm thấy trang này</h1><p>Quay về trang chủ để mở lá thư dành cho người thương nhé.</p><Link className="btn-ink" to="/">Về trang chủ</Link></section></main>
}
