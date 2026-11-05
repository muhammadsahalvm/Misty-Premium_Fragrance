import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CollectionPage from '../pages/CollectionPage'

const catalogue = vi.hoisted(() => ({
  fetchCategories: vi.fn(),
  fetchProducts: vi.fn(),
}))

vi.mock('../services/catalogue', () => catalogue)
vi.mock('../components/ProductCard', () => ({ default: ({ product }) => <p>{product.name}</p> }))

const page = (number) => ({
  results: [{ id: number, name: `Fragrance ${number}` }],
  count: 24,
  next: number === 1 ? 'next' : null,
  previous: number === 2 ? 'previous' : null,
})

describe('collection pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    catalogue.fetchCategories.mockResolvedValue([])
    catalogue.fetchProducts.mockResolvedValue(page(1))
  })

  it('preserves metadata, navigates pages, and keeps filters', async () => {
    render(
      <MemoryRouter initialEntries={['/collection?category=floral&ordering=price']}>
        <CollectionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(catalogue.fetchProducts).toHaveBeenLastCalledWith({
      category: 'floral',
      ordering: 'price',
      page: '2',
    }))
  })

  it('resets to page one when a filter changes', async () => {
    catalogue.fetchProducts.mockResolvedValue(page(2))
    render(
      <MemoryRouter initialEntries={['/collection?page=2&ordering=price']}>
        <CollectionPage />
      </MemoryRouter>,
    )

    await screen.findByText('Page 2 of 2')
    catalogue.fetchProducts.mockResolvedValue(page(1))
    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: '-created_at' } })

    await waitFor(() => expect(catalogue.fetchProducts).toHaveBeenLastCalledWith({
      ordering: '-created_at',
    }))
  })
})
