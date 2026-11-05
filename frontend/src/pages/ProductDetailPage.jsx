import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import ImagePanel from '../components/ImagePanel'
import { fetchProduct } from '../services/catalogue'
import { formatCurrency } from '../utils/formatters'
import { getPrimaryImage } from '../utils/catalogue'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { addCartItem, addWishlistItem } from '../services/commerce'
import { useAppContext } from '../context/useAppContext'

function ProductDetailPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [state, setState] = useState('loading')
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const { user, setCart } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const intentHandled = useRef(false)

  useDocumentTitle(product ? `${product.name} — Misty` : 'Fragrance — Misty')

  useEffect(() => {
    fetchProduct(slug)
      .then((result) => {
        setProduct(result)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [slug])

  const variants = product?.variants?.filter((variant) => variant.is_active) || []
  const intent = location.state?.intent

  function requireAuthentication(intent) {
    if (user) return true
    navigate('/login', { state: { from: location, intent } })
    return false
  }

  useEffect(() => {
    if (!product || !user || !intent || intentHandled.current) return
    intentHandled.current = true
    const activeVariants = product.variants?.filter((variant) => variant.is_active) || []
    const variant = activeVariants.find((item) => item.id === intent.variantId) || activeVariants[0]
    if (!variant) return
    setSelectedVariantId(variant.id)
    setQuantity(intent.quantity || 1)
    if (intent.type === 'add_to_wishlist') {
      addWishlistItem(product.id)
        .then(() => setMessage('Saved to your wishlist.'))
        .catch(() => setMessage('This fragrance could not be saved.'))
        .finally(() => navigate(location.pathname, { replace: true, state: null }))
    } else {
      addCartItem({ variant_id: variant.id, quantity: intent.quantity || 1 })
        .then((nextCart) => {
          setCart(nextCart)
          if (intent.type === 'buy_now') {
            navigate('/checkout', { replace: true, state: { intent: 'buy_now' } })
          } else {
            setMessage('Added to your bag.')
            navigate(location.pathname, { replace: true, state: null })
          }
        })
        .catch((error) => setMessage(Object.values(error.response?.data || {}).flat().join(' ') || 'This fragrance could not be added.'))
    }
  }, [product, user, intent, navigate, location.pathname, setCart])

  if (state === 'loading') {
    return <div className="mx-auto max-w-[1440px] px-6 py-32 text-center text-sm text-charcoal/55">Loading fragrance…</div>
  }

  if (state === 'error' || !product) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="eyebrow">Misty</p>
        <h1 className="editorial-title mt-5">Fragrance not found.</h1>
        <Link className="mt-8 inline-flex border-b border-charcoal pb-2 text-[0.65rem] uppercase tracking-editorial" to="/collection">
          Return to collection
        </Link>
      </section>
    )
  }

  const image = getPrimaryImage(product)
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0]
  const gallery = product.images || []

  async function addToCart() {
    if (!requireAuthentication({ type: 'add_to_cart', productSlug: slug, variantId: selectedVariant.id, quantity })) return false
    try {
      setCart(await addCartItem({ variant_id: selectedVariant.id, quantity }))
      setMessage('Added to your bag.')
      return true
    } catch (error) {
      setMessage(Object.values(error.response?.data || {}).flat().join(' ') || 'This fragrance could not be added.')
      return false
    }
  }



  return (
    <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
      <nav className="mb-8 text-[0.58rem] uppercase tracking-editorial text-charcoal/50" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span className="mx-3">/</span><Link to="/collection">Shop</Link><span className="mx-3">/</span><span>{product.name}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
      <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
        <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
          {gallery.map((item) => (
            <button type="button" className="aspect-square w-16 overflow-hidden border border-charcoal/15 sm:w-full" key={item.id}>
              <img src={item.image_url} alt={item.alt_text || product.name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="order-1 aspect-[4/5] bg-beige sm:order-2">
          {image ? <ImagePanel src={image.image_url} alt={image.alt_text || product.name} className="h-full" /> : null}
        </div>
      </div>
      <div className="self-start border border-charcoal/15 p-6 sm:p-8 lg:p-10">
        <p className="eyebrow">{product.fragrance_family || 'Fine fragrance'}</p>
        <h1 className="editorial-title mt-5">{product.name}</h1>
        <p className="mt-7 max-w-lg text-sm leading-7 text-charcoal/65">{product.description || product.short_description}</p>
        <p className="mt-6 text-[0.65rem] uppercase tracking-editorial text-charcoal/55">{product.concentration || 'Fine fragrance'}</p>
        {variants.length ? (
          <div className="mt-8 border-t border-charcoal/15">
            {variants.map((variant) => (
              <div className="flex items-center justify-between border-b border-charcoal/15 py-5 text-sm" key={variant.id}>
                <button className={`flex-1 text-left ${selectedVariant.id === variant.id ? 'text-charcoal' : 'text-charcoal/55'}`} onClick={() => setSelectedVariantId(variant.id)}>{variant.size_ml} ml</button>
                <span>{formatCurrency(variant.price)}</span>
              </div>
            ))}
          </div>
        ) : null}
        {selectedVariant ? <div className="mt-8 space-y-3"><div className="flex items-center gap-5"><label className="text-xs uppercase tracking-editorial" htmlFor="quantity">Quantity</label><input id="quantity" className="w-16 border-b border-charcoal/25 bg-transparent py-2 text-center" type="number" min="1" max={selectedVariant.stock_quantity} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} /><button className="button flex-1" onClick={addToCart}>Add to bag</button><button className="border border-charcoal/20 p-3" aria-label="Save to wishlist" onClick={() => { if (requireAuthentication({ type: 'add_to_wishlist', productSlug: slug })) addWishlistItem(product.id).then(() => setMessage('Saved to your wishlist.')) }}><span aria-hidden="true">♡</span></button></div><button className="w-full border border-charcoal px-6 py-3 text-[0.65rem] uppercase tracking-editorial" onClick={async () => { if (await addToCart()) navigate('/checkout', { state: { intent: 'buy_now' } }) }}>Buy now</button></div> : null}
        {message ? <p className="mt-4 text-sm text-charcoal/60">{message}</p> : null}
        <Link className="mt-10 inline-flex border-b border-charcoal pb-3 text-[0.65rem] uppercase tracking-editorial" to="/collection">
          Continue exploring
        </Link>
      </div>
      </div>
    </section>
  )
}

export default ProductDetailPage
