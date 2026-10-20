import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="app-error" role="alert">
        <section className="app-error__panel letter-paper">
          <h1>Trang gặp sự cố</h1>
          <p>Dữ liệu của bạn không bị thay đổi. Hãy tải lại trang để tiếp tục.</p>
          <div className="app-error__actions">
            <button type="button" className="btn-ink" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
            <a href="/" className="btn-dashed">Về trang chủ</a>
          </div>
        </section>
      </main>
    )
  }
}

export default ErrorBoundary
