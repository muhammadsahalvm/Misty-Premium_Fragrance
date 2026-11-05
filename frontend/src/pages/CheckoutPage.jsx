import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AddressForm from '../components/AddressForm'
import { checkout, getAddresses } from '../services/commerce'
import { useAppContext } from '../context/useAppContext'
import { formatCurrency } from '../utils/formatters'

function getErrorMessage(requestError, fallback) {
  const data = requestError.response?.data
  if (!data) return fallback
  return Object.values(data).flat().join(' ') || fallback
}

function CheckoutPage() {
  const { cart } = useAppContext()
  const [addresses, setAddresses] = useState([])
  const [selected, setSelected] = useState('')
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [error, setError] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getAddresses()
      .then((items) => {
        setAddresses(items)
        setSelected(String(items.find((item) => item.is_default)?.id || items[0]?.id || ''))
        setShowAddressForm(items.length === 0)
      })
      .catch(() => setError('Saved addresses could not be loaded.'))
      .finally(() => setLoadingAddresses(false))
  }, [])

  function handleAddressSaved(address) {
    setAddresses((current) => [...current, address])
    setSelected(String(address.id))
    setShowAddressForm(false)
    setError('')
  }

  async function placeOrder() {
    if (!selected || placingOrder) return
    setError('')
    setPlacingOrder(true)
    try {
      const order = await checkout(Number(selected))
      navigate(`/orders/${order.id}`)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not place this order.'))
      setPlacingOrder(false)
    }
  }

  if (!cart?.items?.length) return <div className="page-center">Your cart is empty. <Link className="underline" to="/collection">Explore the collection.</Link></div>

  return (
    <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
      <p className="eyebrow">Cash on delivery</p>
      <h1 className="editorial-title mt-5">Complete your order.</h1>
      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_300px]">
        <div>
          <h2 className="font-editorial text-2xl">Shipping address</h2>
          {loadingAddresses ? <p className="mt-6 text-sm text-charcoal/60">Loading your saved addresses…</p> : null}
          {!loadingAddresses && addresses.length ? (
            <div className="mt-6 space-y-3">
              {addresses.map((address) => (
                <label className={`block border p-5 ${String(address.id) === selected ? 'border-charcoal' : 'border-charcoal/15'}`} key={address.id}>
                  <input className="mr-3" type="radio" name="address" checked={String(address.id) === selected} onChange={() => setSelected(String(address.id))} />
                  <strong>{address.recipient_name}</strong>
                  <p className="ml-6 mt-2 text-sm leading-6 text-charcoal/60">
                    {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}, {address.city}, {address.state} {address.postal_code}
                  </p>
                </label>
              ))}
              {!showAddressForm ? <button className="mt-3 border-b border-charcoal pb-1 text-[0.65rem] uppercase tracking-editorial" type="button" onClick={() => setShowAddressForm(true)}>Add new address</button> : null}
            </div>
          ) : null}
          {!loadingAddresses && showAddressForm ? (
            <AddressForm
              initialValues={{ recipient_name: '', country: 'India' }}
              onSaved={handleAddressSaved}
              onCancel={addresses.length ? () => setShowAddressForm(false) : undefined}
            />
          ) : null}
          {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}
        </div>
        <aside className="h-fit border border-charcoal/15 p-7">
          <p className="flex justify-between text-sm"><span>Total</span><strong>{formatCurrency(cart.total)}</strong></p>
          <p className="mt-4 text-xs text-charcoal/55">Payment method: Cash on delivery</p>
          <button className="button mt-8 w-full" disabled={!selected || placingOrder || loadingAddresses} onClick={placeOrder}>
            {placingOrder ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage
