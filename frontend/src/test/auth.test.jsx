import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProvider } from '../context/AppContext'
import { useAppContext } from '../context/useAppContext'
import api from '../services/api'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../services/auth'

vi.mock('../services/commerce', () => ({
  getCart: vi.fn().mockResolvedValue(null),
}))

vi.mock('../services/auth', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getProfile: vi.fn(),
  }
})

import { getProfile } from '../services/auth'

function Consumer() {
  const { accessToken, authLoading, login, logout, user } = useAppContext()
  return (
    <>
      <output data-testid="token">{accessToken || ''}</output>
      <output data-testid="loading">{String(authLoading)}</output>
      <output data-testid="user">{user?.email || ''}</output>
      <button onClick={() => login({ email: 'customer@example.com', password: 'valid-password' })}>login</button>
      <button onClick={logout}>logout</button>
    </>
  )
}

describe('authentication context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('logs in, stores both tokens, loads the profile, and logs out cleanly', async () => {
    const profile = { id: 1, email: 'customer@example.com' }
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { access: 'access-1', refresh: 'refresh-1' } })
    getProfile.mockResolvedValue(profile)

    render(<AppProvider><Consumer /></AppProvider>)
    await act(async () => screen.getByRole('button', { name: 'login' }).click())

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(profile.email))
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-1')
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1')
    expect(screen.getByTestId('token')).toHaveTextContent('access-1')

    await act(async () => screen.getByRole('button', { name: 'logout' }).click())
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('')
  })

  it('loads the profile from a stored access token after refresh', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'stored-access')
    getProfile.mockResolvedValue({ email: 'returning@example.com' })

    render(<AppProvider><Consumer /></AppProvider>)

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('returning@example.com'))
    expect(screen.getByTestId('token')).toHaveTextContent('stored-access')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })
})

