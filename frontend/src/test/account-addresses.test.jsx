import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AccountPage from '../pages/AccountPage'

const commerce = vi.hoisted(() => ({
  deleteAddress: vi.fn(),
  getAddresses: vi.fn(),
  getOrders: vi.fn(),
  saveAddress: vi.fn(),
}))

vi.mock('../services/commerce', () => commerce)
vi.mock('../services/auth', () => ({
  updateProfile: vi.fn(),
}))
vi.mock('../context/useAppContext', () => ({
  useAppContext: () => ({
    user: { id: 1, email: 'customer@example.com', first_name: 'Aria', last_name: 'Vance', phone_number: '' },
    setUser: vi.fn(),
  }),
}))

const address = {
  id: 12,
  recipient_name: 'Aria Vance',
  phone_number: '+919876543210',
  address_line1: '12 Rose Street',
  address_line2: 'Apartment 4',
  landmark: 'Near the park',
  city: 'Mumbai',
  state: 'Maharashtra',
  postal_code: '400001',
  country: 'India',
  is_default: true,
}

describe('account address manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    commerce.getAddresses.mockResolvedValue([address])
    commerce.getOrders.mockResolvedValue([])
    commerce.deleteAddress.mockResolvedValue({})
    commerce.saveAddress.mockResolvedValue({ ...address, address_line1: '24 Cedar Lane' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('displays saved address details with edit and delete controls', async () => {
    render(<MemoryRouter><AccountPage /></MemoryRouter>)

    expect(await screen.findByText('12 Rose Street')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit address for Aria Vance' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete address for Aria Vance' })).toBeInTheDocument()
  })

  it('edits an existing address through the shared form', async () => {
    render(<MemoryRouter><AccountPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit address for Aria Vance' }))
    fireEvent.change(screen.getByPlaceholderText('Address line'), { target: { value: '24 Cedar Lane' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))

    await waitFor(() => expect(commerce.saveAddress).toHaveBeenCalledWith(expect.objectContaining({ address_line1: '24 Cedar Lane' }), 12))
    expect(await screen.findByText('24 Cedar Lane')).toBeInTheDocument()
  })

  it('deletes an address and removes it from the profile', async () => {
    render(<MemoryRouter><AccountPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Delete address for Aria Vance' }))

    await waitFor(() => expect(commerce.deleteAddress).toHaveBeenCalledWith(12))
    await waitFor(() => expect(screen.queryByText('12 Rose Street')).not.toBeInTheDocument())
  })
})
