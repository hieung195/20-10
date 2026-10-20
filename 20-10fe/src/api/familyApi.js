import api from '../services/api'
export async function generateFamilyGreeting(name) {
  return (await api.post('/api/greetings/generate', { name, audienceType: 'family' })).data.data
}

async function uploadToCloudinary(file) {
  const signed = (await api.post('/api/uploads/signature')).data.data
  const form = new FormData()
  form.append('file', file)
  for (const key of ['apiKey', 'allowed_formats', 'overwrite', 'public_id', 'signature', 'timestamp']) {
    const cloudinaryKey = key === 'apiKey' ? 'api_key' : key
    form.append(cloudinaryKey, String(signed[key]))
  }
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, { method: 'POST', body: form })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error?.message || 'Không tải được ảnh lên Cloudinary.')
  return { url: result.secure_url, publicId: result.public_id, bytes: result.bytes, format: result.format }
}

export async function sendFamilyFeedback({ name, sender, content, requestId, files = [] }) {
  if (!files.length) return (await api.post('/api/feedback', { name, sender, content, requestId, images: [] })).data.data

  const { mode } = (await api.get('/api/uploads/config')).data.data
  if (mode === 'unavailable') throw new Error('Máy chủ chưa cấu hình Cloudinary để nhận ảnh.')
  if (mode === 'cloudinary') {
    const images = await Promise.all(files.map(uploadToCloudinary))
    return (await api.post('/api/feedback', { name, sender, content, requestId, images })).data.data
  }

  const data = new FormData()
  data.append('name', name)
  data.append('sender', sender)
  data.append('content', content)
  data.append('requestId', requestId)
  files.forEach(file => data.append('images', file))
  return (await api.post('/api/feedback', data, { timeout: 0 })).data.data
}

export async function listFamilyFeedback(name) {
  return (await api.get('/api/feedback', { params: { name } })).data.data
}
