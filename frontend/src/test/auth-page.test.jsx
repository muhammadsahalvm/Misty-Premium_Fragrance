import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import AuthPage from '../pages/AuthPage'

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}))

vi.mock('../context/useAppContext', () => ({
  useAppContext: () => auth,
}))

function LocationOutput() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

describe('authentication form', () => {
  it('rejects mismatched registration passwords before making an API request', async () => {
    auth.register.mockReset()
    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthPage mode="register" />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('first name'), { target: { value: 'Aria' } })
    fireEvent.change(screen.getByPlaceholderText('last name'), { target: { value: 'Vance' } })
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'aria@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'PasswordOne2026!' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'PasswordTwo2026!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(auth.register).not.toHaveBeenCalled()
  })

  it('logs in once and preserves the requested destination', async () => {
    auth.login.mockReset().mockResolvedValue({ id: 1, email: 'aria@example.com' })
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/login',
        state: {
          from: { pathname: '/collection/amber-noir', search: '?size=50', hash: '#buy' },
          intent: { type: 'buy_now', variantId: 7, quantity: 1 },
        },
      }]}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<LocationOutput />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'aria@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'PasswordOne2026!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/collection/amber-noir'))
    expect(auth.login).toHaveBeenCalledTimes(1)
  })
})
