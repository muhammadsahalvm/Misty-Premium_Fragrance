import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CheckoutPage from '../pages/CheckoutPage'

const commerce = vi.hoisted(() => ({
  checkout: vi.fn(),
  getAddresses: vi.fn(),
  saveAddress: vi.fn(),
}))

vi.mock('../services/commerce', () => ({
  checkout: commerce.checkout,
  getAddresses: commerce.getAddresses,
  saveAddress: commerce.saveAddress,
}))

vi.mock('../context/useAppContext', () => ({
  useAppContext: () => ({
    cart: { items: [{ id: 1 }], total: '2500.00' },
  }),
}))

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders/:id" element={<p>Order confirmation</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const address = {
  id: 12,
  recipient_name: 'Aria Vance',
  phone_number: '+919876543210',
  address_line1: '12 Rose Street',
  address_line2: '',
  landmark: '',
  city: 'Mumbai',
  state: 'Maharashtra',
  postal_code: '400001',
  country: 'India',
  is_default: true,
}

describe('checkout address flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    commerce.checkout.mockResolvedValue({ id: 88 })
    commerce.saveAddress.mockResolvedValue(address)
  })

  it('shows the address form when no saved addresses exist', async () => {
    commerce.getAddresses.mockResolvedValue([])
    renderCheckout()

    expect(await screen.findByPlaceholderText('Full name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Apartment / suite (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled()
  })

  it('selects an existing saved address and highlights it', async () => {
    commerce.getAddresses.mockResolvedValue([address])
    renderCheckout()

    const radio = await screen.findByRole('radio')
    expect(radio).toBeChecked()
    expect(radio.closest('label')).toHaveClass('border-charcoal')
    expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled()
  })

  it('saves a new address and selects the returned address', async () => {
    commerce.getAddresses.mockResolvedValue([address])
    const created = { ...address, id: 24, recipient_name: 'New Customer' }
    commerce.saveAddress.mockResolvedValue(created)
    renderCheckout()

    fireEvent.click(await screen.findByRole('button', { name: 'Add new address' }))
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'New Customer' } })
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '+919876543210' } })
    fireEvent.change(screen.getByPlaceholderText('Address line'), { target: { value: '24 Cedar Lane' } })
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Pune' } })
    fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'Maharashtra' } })
    fireEvent.change(screen.getByPlaceholderText('Postal code'), { target: { value: '411001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))

    await waitFor(() => expect(screen.getByRole('radio', { name: /New Customer/ })).toBeChecked())
    expect(commerce.saveAddress).toHaveBeenCalledWith(expect.objectContaining({ recipient_name: 'New Customer', country: 'India' }), undefined)
  })

  it('rejects incomplete address data before calling the address API', async () => {
    commerce.getAddresses.mockResolvedValue([])
    renderCheckout()

    fireEvent.click(await screen.findByRole('button', { name: 'Save address' }))

    expect(await screen.findByText('Please complete all required address fields.')).toBeInTheDocument()
    expect(commerce.saveAddress).not.toHaveBeenCalled()
  })

  it('displays address API errors and keeps checkout unavailable', async () => {
    commerce.getAddresses.mockResolvedValue([])
    commerce.saveAddress.mockRejectedValue({ response: { data: { phone_number: ['Phone number is invalid.'] } } })
    renderCheckout()

    const fields = [
      ['Full name', 'Aria Vance'],
      ['Phone number', 'bad'],
      ['Address line', '12 Rose Street'],
      ['City', 'Mumbai'],
      ['State', 'Maharashtra'],
      ['Postal code', '400001'],
    ]
    for (const [placeholder, value] of fields) {
      fireEvent.change(await screen.findByPlaceholderText(placeholder), { target: { value } })
    }
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))

    expect(await screen.findByText('Phone number is invalid.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Place order' })).toBeDisabled()
  })

  it('places a COD order with the selected address and prevents duplicate submissions', async () => {
    commerce.getAddresses.mockResolvedValue([address])
    commerce.checkout.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ id: 88 }), 20)))
    renderCheckout()

    const button = await screen.findByRole('button', { name: 'Place order' })
    fireEvent.click(button)
    fireEvent.click(button)

    expect(commerce.checkout).toHaveBeenCalledTimes(1)
    expect(commerce.checkout).toHaveBeenCalledWith(12)
    expect(await screen.findByText('Order confirmation')).toBeInTheDocument()
  })

  it('displays order API errors and does not clear or alter the cart', async () => {
    commerce.getAddresses.mockResolvedValue([address])
    commerce.checkout.mockRejectedValue({ response: { data: { address_id: ['Address is unavailable.'] } } })
    renderCheckout()

    fireEvent.click(await screen.findByRole('button', { name: 'Place order' }))

    expect(await screen.findByText('Address is unavailable.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Place order' })).toBeEnabled()
  })
})
