import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CartPage from '../pages/CartPage'

const commerce = vi.hoisted(() => ({
  clearCart: vi.fn(),
  getCart: vi.fn(),
  removeCartItem: vi.fn(),
  updateCartItem: vi.fn(),
}))
const context = vi.hoisted(() => ({ cart: null, setCart: vi.fn() }))

vi.mock('../services/commerce', () => commerce)
vi.mock('../context/useAppContext', () => ({ useAppContext: () => context }))

const cart = {
  items: [{ id: 1, product: { name: 'Nocturne' }, size_ml: 50, sku: 'NO-50', price: '1000.00', quantity: 1 }],
  total: '1000.00',
}

describe('cart mutation errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    context.cart = cart
    commerce.getCart.mockResolvedValue(cart)
  })

  it('displays quantity and removal failures', async () => {
    commerce.updateCartItem.mockRejectedValue(new Error('stock'))
    commerce.removeCartItem.mockRejectedValue(new Error('network'))
    render(<MemoryRouter><CartPage /></MemoryRouter>)

    await screen.findByText('Nocturne')
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('could not update')
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('could not remove')
  })

  it('handles clear failures and prevents duplicate requests', async () => {
    commerce.clearCart.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('network')), 20)))
    render(<MemoryRouter><CartPage /></MemoryRouter>)

    await screen.findByText('Nocturne')
    const clearButton = screen.getByRole('button', { name: 'Clear bag' })
    fireEvent.click(clearButton)
    fireEvent.click(clearButton)
    expect(commerce.clearCart).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('could not clear'))
  })
})
