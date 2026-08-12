import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  permissions: string[]
  country: string | null
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: JSON.parse(sessionStorage.getItem('gsg_scan_user') ?? 'null'),
    accessToken: sessionStorage.getItem('gsg_scan_token'),
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    hasPermission: (state) => (perm: string) =>
      !!state.user?.permissions.some((p) => p === '*' || p === perm),
  },

  actions: {
    async login(email: string, password: string) {
      const res = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      this.setSession(res.data.user, res.data.accessToken)
    },

    async refresh(): Promise<string> {
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      this.accessToken = res.data.accessToken
      sessionStorage.setItem('gsg_scan_token', res.data.accessToken)
      return res.data.accessToken
    },

    async logout() {
      try {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true })
      } finally {
        this.user = null
        this.accessToken = null
        sessionStorage.removeItem('gsg_scan_user')
        sessionStorage.removeItem('gsg_scan_token')
      }
    },

    setSession(user: AuthUser, accessToken: string) {
      this.user = user
      this.accessToken = accessToken
      sessionStorage.setItem('gsg_scan_user', JSON.stringify(user))
      sessionStorage.setItem('gsg_scan_token', accessToken)
    },
  },
})
