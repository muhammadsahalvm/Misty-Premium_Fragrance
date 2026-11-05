import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatCurrency } from '../utils/formatters'
import { getLowestVariant, getPrimaryImage } from '../utils/catalogue'

function ProductCard({ product }) {
  const image = getPrimaryImage(product)
  const lowestVariant = getLowestVariant(product)
  const [imageError, setImageError] = useState(false)

  return (
    <Link className="group block" to={`/collection/${product.slug}`}>
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
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-charcoal opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight size={16} strokeWidth={1.3} />
        </span>
      </div>
      <div className="flex items-start justify-between gap-4 pt-5">
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
      </div>
    </Link>
  )
}

export default ProductCard
