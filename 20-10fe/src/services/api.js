import axios from 'axios'
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})
api.interceptors.request.use(config => {
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  return config
})
api.interceptors.response.use(response => response, error => Promise.reject(Object.assign(
  new Error(error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Máy chủ phản hồi quá chậm' : 'Không thể kết nối tới máy chủ')),
  { status: error.response?.status, isNetworkError: !error.response },
)))
export default api
