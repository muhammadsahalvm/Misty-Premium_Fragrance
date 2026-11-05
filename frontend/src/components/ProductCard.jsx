import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { formatCurrency } from '../utils/formatters'
import { getLowestVariant, getPrimaryImage } from '../utils/catalogue'
import { addWishlistItem, removeWishlistItem } from '../services/commerce'
import { useAppContext } from '../context/useAppContext'

function ProductCard({ product }) {
  const image = getPrimaryImage(product)
  const lowestVariant = getLowestVariant(product)
  const [imageError, setImageError] = useState(false)
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [wishlistError, setWishlistError] = useState('')
  const { user, wishlist, setWishlist } = useAppContext()
  const navigate = useNavigate()
  const wishlistItem = wishlist?.items?.find((item) => item.product?.id === product.id)
  const isWishlisted = Boolean(wishlistItem)

  async function toggleWishlist(event) {
    event.preventDefault()
    event.stopPropagation()
    if (wishlistBusy) return
    if (!user) {
      navigate('/login', {
        state: {
          from: { pathname: `/collection/${product.slug}`, search: '' },
          intent: { type: 'add_to_wishlist', productSlug: product.slug, productId: product.id },
        },
      })
      return
    }
    setWishlistBusy(true)
    setWishlistError('')
    try {
      const nextWishlist = isWishlisted
        ? await removeWishlistItem(wishlistItem.id)
        : await addWishlistItem(product.id)
      setWishlist(nextWishlist)
    } catch {
      setWishlistError('Unable to update wishlist.')
    } finally {
      setWishlistBusy(false)
    }
  }

  return (
    <article className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        {image && !imageError ? (
          <img
            src={image.image_url}
            alt={image.alt_text || product.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-end p-6 text-charcoal/45">
            <span className="font-editorial text-3xl">{product.name}</span>
          </div>
        )}
        <button type="button" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink opacity-100 transition hover:bg-paper" aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`} aria-pressed={isWishlisted} disabled={wishlistBusy} onClick={toggleWishlist}>
          <Heart size={16} strokeWidth={1.3} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
      {wishlistError ? <p role="alert" className="mt-2 text-xs text-oxblood">{wishlistError}</p> : null}
      <Link className="flex items-start justify-between gap-4 pt-5" to={`/collection/${product.slug}`}>
        <div>
          <p className="font-editorial text-xl text-charcoal">{product.name}</p>
          <p className="mt-2 text-[0.62rem] uppercase tracking-editorial text-charcoal/50">
            {product.fragrance_family || 'Fine fragrance'}
          </p>
        </div>
        {lowestVariant ? (
          <p className="pt-1 text-xs text-charcoal/65">
            From {formatCurrency(lowestVariant.price)}
          </p>
        ) : null}
      </Link>
      <Link className="sr-only" to={`/collection/${product.slug}`}>View {product.name}</Link>
    </article>
  )
}

export default ProductCard
