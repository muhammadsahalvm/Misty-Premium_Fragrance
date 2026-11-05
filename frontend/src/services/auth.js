import api from './api'

export const ACCESS_TOKEN_KEY = 'misty_access'
export const REFRESH_TOKEN_KEY = 'misty_refresh'

export async function login(credentials) {
  const { data } = await api.post('/accounts/login/', credentials)
  return data
}

export async function register(payload) {
  const { data } = await api.post('/accounts/register/', payload)
  return data
}

export async function getProfile() {
  const { data } = await api.get('/accounts/me/')
  return data
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/accounts/me/', payload)
  return data
}

export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
