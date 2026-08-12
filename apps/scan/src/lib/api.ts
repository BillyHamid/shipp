import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send refresh cookie
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const auth = useAuthStore()
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        refreshing ??= auth.refresh()
        const newToken = await refreshing
        refreshing = null
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        refreshing = null
        auth.logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
