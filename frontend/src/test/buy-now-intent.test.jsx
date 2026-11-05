import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProductDetailPage from '../pages/ProductDetailPage'

const catalogue = vi.hoisted(() => ({ fetchProduct: vi.fn() }))
const commerce = vi.hoisted(() => ({ addCartItem: vi.fn(), addWishlistItem: vi.fn() }))
const context = vi.hoisted(() => ({ user: { id: 1 }, setCart: vi.fn() }))

vi.mock('../services/catalogue', () => catalogue)
vi.mock('../services/commerce', () => commerce)
vi.mock('../context/useAppContext', () => ({ useAppContext: () => context }))

describe('buy now intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogue.fetchProduct.mockResolvedValue({
      id: 7,
      slug: 'nocturne',
      name: 'Nocturne',
      variants: [{ id: 42, size_ml: 50, price: '2500.00', stock_quantity: 4, is_active: true }],
      images: [],
    })
    commerce.addCartItem.mockResolvedValue({ items: [{ variant_id: 42 }], total: '2500.00' })
  })

  it('adds the selected variant once and navigates to checkout', async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/collection/nocturne',
        state: { intent: { type: 'buy_now', variantId: 42, quantity: 1 } },
      }]}>
        <Routes>
          <Route path="/collection/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<p>Checkout destination</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Checkout destination')).toBeInTheDocument()
    await waitFor(() => expect(commerce.addCartItem).toHaveBeenCalledTimes(1))
    expect(commerce.addCartItem).toHaveBeenCalledWith({ variant_id: 42, quantity: 1 })
  })

  it('adds a product to the wishlist without changing the cart', async () => {
    commerce.addWishlistItem.mockResolvedValue({})
    render(
      <MemoryRouter initialEntries={['/collection/nocturne']}>
        <Routes>
          <Route path="/collection/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Nocturne' })
    await screen.findByRole('button', { name: 'Save to wishlist' })
    screen.getByRole('button', { name: 'Save to wishlist' }).click()
    await waitFor(() => expect(commerce.addWishlistItem).toHaveBeenCalledWith(7))
    expect(commerce.addCartItem).not.toHaveBeenCalled()
  })
})
