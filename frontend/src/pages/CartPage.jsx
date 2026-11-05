import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { clearCart, getCart, removeCartItem, updateCartItem } from '../services/commerce'
import { useAppContext } from '../context/useAppContext'
import { formatCurrency } from '../utils/formatters'

function CartPage() {
  const { cart, setCart } = useAppContext()
  const [state, setState] = useState('loading')
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getCart().then((data) => { setCart(data); setState('ready') }).catch(() => setState('error')) }, [setCart])
  async function change(id, quantity) {
    if (pending) return
    setError('')
    setPending(`update-${id}`)
    try { setCart(await updateCartItem(id, { quantity })) } catch { setError('We could not update that quantity. Please try again.') } finally { setPending(null) }
  }
  async function remove(id) {
    if (pending) return
    setError('')
    setPending(`remove-${id}`)
    try { setCart(await removeCartItem(id)) } catch { setError('We could not remove that item. Please try again.') } finally { setPending(null) }
  }
  async function clear() {
    if (pending) return
    setError('')
    setPending('clear')
    try { setCart(await clearCart()) } catch { setError('We could not clear your bag. Please try again.') } finally { setPending(null) }
  }
  if (state === 'loading') return <div className="page-center">Loading your bag…</div>
  if (state === 'error') return <div className="page-center">Your bag is unavailable right now.</div>
  return <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28"><p className="eyebrow">Your bag</p><h1 className="editorial-title mt-5">A considered selection.</h1>{error ? <p role="alert" className="mt-6 text-sm text-red-700">{error}</p> : null}{cart?.items?.length ? <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_320px]"><div>{cart.items.map((item) => <div className="flex gap-5 border-b border-charcoal/15 py-6" key={item.id}><div className="flex-1"><h2 className="font-editorial text-2xl">{item.product.name}</h2><p className="mt-2 text-xs uppercase tracking-editorial text-charcoal/50">{item.size_ml} ml · {item.sku}</p><p className="mt-3 text-sm">{formatCurrency(item.price)}</p></div><div className="flex items-center gap-3"><button disabled={Boolean(pending)} aria-label="Decrease quantity" onClick={() => item.quantity > 1 && change(item.id, item.quantity - 1)}><Minus size={15} /></button><span>{item.quantity}</span><button disabled={Boolean(pending)} aria-label="Increase quantity" onClick={() => change(item.id, item.quantity + 1)}><Plus size={15} /></button><button disabled={Boolean(pending)} aria-label="Remove item" onClick={() => remove(item.id)}><Trash2 size={16} /></button></div></div>)}</div><aside className="h-fit border border-charcoal/15 p-7"><p className="flex justify-between text-sm"><span>Total</span><strong>{formatCurrency(cart.total)}</strong></p><button type="button" className="mt-6 w-full text-xs uppercase tracking-editorial underline" disabled={Boolean(pending)} onClick={clear}>Clear bag</button><Link className="button mt-7 w-full" to="/checkout">Proceed to checkout</Link><Link className="mt-5 block text-center text-xs uppercase tracking-editorial" to="/collection">Continue shopping</Link></aside></div> : <div className="mt-14 border border-charcoal/15 px-6 py-16 text-center"><p className="font-editorial text-3xl">Your bag is empty.</p><Link className="button mt-8" to="/collection">Explore collection</Link></div>}</section>
}

export default CartPage
