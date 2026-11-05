import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AddressForm from '../components/AddressForm'
import { updateProfile } from '../services/auth'
import { deleteAddress, getAddresses, getOrders } from '../services/commerce'
import { useAppContext } from '../context/useAppContext'

function formatAddress(address) {
  return [
    address.address_line1,
    address.address_line2,
    address.landmark,
    `${address.city}, ${address.state} ${address.postal_code}`,
    address.country,
  ].filter(Boolean)
}

function AccountPage() {
  const { user, setUser } = useAppContext()
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [phone, setPhone] = useState(user.phone_number || '')
  const [editingId, setEditingId] = useState(null)
  const [addingAddress, setAddingAddress] = useState(false)
  const [addressError, setAddressError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    getAddresses().then(setAddresses).catch(() => setAddressError('Saved addresses could not be loaded.'))
    getOrders().then(setOrders).catch(() => {})
  }, [])

  async function saveProfile() {
    setUser(await updateProfile({
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: phone,
    }))
  }

  function handleAddressSaved(savedAddress) {
    setAddresses((current) => {
      const exists = current.some((address) => address.id === savedAddress.id)
      return exists
        ? current.map((address) => (address.id === savedAddress.id ? savedAddress : address))
        : [...current, savedAddress]
    })
    setEditingId(null)
    setAddingAddress(false)
    setAddressError('')
  }

  async function removeAddress(address) {
    if (!window.confirm('Delete this saved address?')) return
    setDeletingId(address.id)
    setAddressError('')
    try {
      await deleteAddress(address.id)
      setAddresses((current) => current.filter((item) => item.id !== address.id))
    } catch {
      setAddressError('This address could not be deleted.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
      <p className="eyebrow">Your account</p>
      <h1 className="editorial-title mt-5">Welcome, {user.first_name || user.email}.</h1>

      <div className="mt-14 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-editorial text-2xl">Profile</h2>
          <p className="mt-5 text-sm text-charcoal/60">{user.email}</p>
          <input className="field mt-5" value={phone} placeholder="Phone number" onChange={(event) => setPhone(event.target.value)} />
          <button className="button mt-6" onClick={saveProfile}>Save profile</button>
          <Link className="mt-8 block text-xs uppercase tracking-editorial underline" to="/wishlist">View wishlist</Link>
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl">Saved addresses</h2>
              <p className="mt-5 text-sm text-charcoal/60">
                {addresses.length ? `${addresses.length} saved address${addresses.length > 1 ? 'es' : ''}` : 'No saved addresses yet.'}
              </p>
            </div>
            {!addingAddress && !editingId ? (
              <button className="border border-charcoal/20 p-3" type="button" aria-label="Add new address" onClick={() => setAddingAddress(true)}>
                <Plus size={16} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {addresses.map((address) => (
              <article className="border border-charcoal/15 p-5" key={address.id}>
                {editingId === address.id ? (
                  <AddressForm
                    key={`edit-${address.id}`}
                    addressId={address.id}
                    initialValues={address}
                    onSaved={handleAddressSaved}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{address.recipient_name}</p>
                        <p className="mt-2 text-xs leading-6 text-charcoal/60">
                          {formatAddress(address).map((line) => <span className="block" key={line}>{line}</span>)}
                        </p>
                        <p className="mt-2 text-xs text-charcoal/60">{address.phone_number}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button className="p-2 text-charcoal/60 hover:text-charcoal" type="button" aria-label={`Edit address for ${address.recipient_name}`} onClick={() => { setAddingAddress(false); setEditingId(address.id) }}>
                          <Pencil size={15} strokeWidth={1.5} />
                        </button>
                        <button className="p-2 text-charcoal/60 hover:text-red-700" type="button" aria-label={`Delete address for ${address.recipient_name}`} onClick={() => removeAddress(address)} disabled={deletingId === address.id}>
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    {address.is_default ? <p className="mt-4 text-[0.58rem] uppercase tracking-editorial text-champagne">Default address</p> : null}
                  </>
                )}
              </article>
            ))}
          </div>

          {addingAddress ? (
            <div className="mt-4 border border-charcoal/15 p-5">
              <h3 className="font-editorial text-xl">Add a new address</h3>
              <AddressForm
                initialValues={{ recipient_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), phone_number: user.phone_number || '' }}
                onSaved={handleAddressSaved}
                onCancel={() => setAddingAddress(false)}
              />
            </div>
          ) : null}
          {addressError ? <p className="mt-4 text-sm text-red-700">{addressError}</p> : null}
        </div>
      </div>

      <div className="mt-16 border-t border-charcoal/15 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl">Order history</h2>
          <Link className="text-xs uppercase tracking-editorial underline" to="/orders">View all</Link>
        </div>
        <p className="mt-5 text-sm text-charcoal/60">{orders.length ? `${orders.length} order${orders.length > 1 ? 's' : ''}` : 'No orders yet.'}</p>
      </div>
    </section>
  )
}

export default AccountPage
