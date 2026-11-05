import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import ProtectedRoute from '../components/ProtectedRoute'

const context = vi.hoisted(() => ({ user: null, authLoading: false }))
vi.mock('../context/useAppContext', () => ({
  useAppContext: () => context,
}))

function Destination() {
  const location = useLocation()
  return <output data-testid="destination">{`${location.pathname}${location.search}`}</output>
}

describe('protected route redirects', () => {
  it('preserves the full requested URL while redirecting logged-out users', () => {
    context.user = null
    render(
      <MemoryRouter initialEntries={['/account?tab=orders']}>
        <Routes>
          <Route path="/account" element={<ProtectedRoute><Destination /></ProtectedRoute>} />
          <Route path="/login" element={<Destination />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('destination')).toHaveTextContent('/login')
  })

  it('renders the protected destination for an authenticated user', () => {
    context.user = { id: 1, email: 'customer@example.com' }
    render(
      <MemoryRouter initialEntries={['/account?tab=profile']}>
        <Routes>
          <Route path="/account" element={<ProtectedRoute><Destination /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('destination')).toHaveTextContent('/account?tab=profile')
  })
})
