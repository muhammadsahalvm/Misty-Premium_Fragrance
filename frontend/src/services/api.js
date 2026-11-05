import axios from 'axios'

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
})

let refreshRequest = null

api.interceptors.request.use((config) => {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)
    const isRefreshRequest = original?.url?.includes('/accounts/token/refresh/')

    if (error.response?.status === 401 && refresh && original && !original._retry && !isRefreshRequest) {
      original._retry = true
      try {
        refreshRequest ||= axios.post(`${api.defaults.baseURL}/accounts/token/refresh/`, { refresh })
        const { data } = await refreshRequest
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
        window.dispatchEvent(new CustomEvent('misty:token-refreshed', { detail: data.access }))
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshError) {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        window.dispatchEvent(new Event('misty:auth-expired'))
        return Promise.reject(refreshError)
      } finally {
        refreshRequest = null
      }
    }

    return Promise.reject(error)
  },
)

export default api
