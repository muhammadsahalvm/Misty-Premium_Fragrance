import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OrdersPage from '../pages/OrdersPage'
import OrderDetailPage from '../pages/OrderDetailPage'

const commerce = vi.hoisted(() => ({
  cancelOrder: vi.fn(),
  getOrder: vi.fn(),
  getOrders: vi.fn(),
}))

vi.mock('../services/commerce', () => commerce)

describe('order error states', () => {
  beforeEach(() => vi.clearAllMocks())

  it('distinguishes order API failure from an empty history and retries', async () => {
    commerce.getOrders.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([])
    render(<MemoryRouter><OrdersPage /></MemoryRouter>)

    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No orders yet.')).toBeInTheDocument()
    expect(commerce.getOrders).toHaveBeenCalledTimes(2)
  })

  it('shows cancellation failures and prevents duplicate requests', async () => {
    commerce.getOrder.mockResolvedValue({ id: 4, order_number: 'MST-4', status: 'pending', items: [] })
    commerce.cancelOrder.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('blocked')), 20)))
    render(<MemoryRouter initialEntries={['/orders/4']}><Routes><Route path="/orders/:id" element={<OrderDetailPage />} /></Routes></MemoryRouter>)

    const button = await screen.findByRole('button', { name: 'Cancel order' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(commerce.cancelOrder).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not cancel')
  })
})
