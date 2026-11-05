import { beforeEach, describe, expect, it, vi } from 'vitest'

import axios from 'axios'
import api from '../services/api'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../services/auth'

describe('API authentication interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('attaches the stored access token', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'access-1')
    api.defaults.adapter = async (config) => ({ data: config.headers.Authorization, status: 200, statusText: 'OK', headers: {}, config })

    const response = await api.get('/protected/')

    expect(response.data).toBe('Bearer access-1')
  })

  it('shares one refresh request between concurrent 401 responses and retries both calls', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired')
    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-1')
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access: 'access-2' } })
    let attempts = 0
    api.defaults.adapter = async (config) => {
      attempts += 1
      if (config.headers.Authorization === 'Bearer expired') {
        return Promise.reject({ config, response: { status: 401 } })
      }
      return { data: config.headers.Authorization, status: 200, statusText: 'OK', headers: {}, config }
    }

    const responses = await Promise.all([api.get('/one/'), api.get('/two/')])

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(attempts).toBe(4)
    expect(responses.map((response) => response.data)).toEqual(['Bearer access-2', 'Bearer access-2'])
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-2')
  })

  it('clears tokens and broadcasts expiry when refresh fails', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired')
    localStorage.setItem(REFRESH_TOKEN_KEY, 'invalid-refresh')
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('invalid refresh'))
    const expired = vi.fn()
    window.addEventListener('misty:auth-expired', expired)
    api.defaults.adapter = async (config) => Promise.reject({ config, response: { status: 401 } })

    await expect(api.get('/protected/')).rejects.toThrow('invalid refresh')
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
    expect(expired).toHaveBeenCalledTimes(1)
    window.removeEventListener('misty:auth-expired', expired)
  })
})
