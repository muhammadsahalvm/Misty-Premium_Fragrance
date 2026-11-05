import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WishlistPage from '../pages/WishlistPage'
import { AppContext } from '../context/context'

const commerce = vi.hoisted(() => ({
  getWishlist: vi.fn(),
  removeWishlistItem: vi.fn(),
}))

vi.mock('../services/commerce', () => commerce)
vi.mock('../components/ProductCard', () => ({ default: ({ product }) => <p>{product.name}</p> }))

function renderWishlist() {
  function Harness() {
    const [wishlist, setWishlist] = useState(null)
    return <AppContext.Provider value={{ user: { id: 1 }, wishlist, setWishlist }}><MemoryRouter><WishlistPage /></MemoryRouter></AppContext.Provider>
  }
  return render(<Harness />)
}

describe('wishlist states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    commerce.getWishlist.mockResolvedValue({ items: [{ id: 9, product: { id: 2, name: 'Nocturne' } }] })
  })

  it('loads and removes a saved product', async () => {
    commerce.removeWishlistItem.mockResolvedValue({ items: [] })
    renderWishlist()
    expect(await screen.findByText('Nocturne')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(await screen.findByText('Nothing saved yet.')).toBeInTheDocument()
  })

  it('displays removal failures', async () => {
    commerce.removeWishlistItem.mockRejectedValue(new Error('network'))
    renderWishlist()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('could not remove')
  })
})
