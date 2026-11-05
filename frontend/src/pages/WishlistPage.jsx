import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { getWishlist, removeWishlistItem } from '../services/commerce'

function WishlistPage() {
  const [wishlist, setWishlist] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getWishlist().then(setWishlist).catch(() => setError('Your wishlist is unavailable right now.')) }, [])
  if (error) return <div className="page-center">{error}</div>
  if (!wishlist) return <div className="page-center">Loading your wishlist…</div>
  return <section className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-28 lg:px-16"><p className="eyebrow">Saved fragrances</p><h1 className="editorial-title mt-5">Your wishlist.</h1>{wishlist.items?.length ? <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{wishlist.items.map((item) => <div key={item.id}><ProductCard product={item.product} /><button className="mt-4 text-[0.62rem] uppercase tracking-editorial text-charcoal/60" onClick={() => removeWishlistItem(item.id).then(setWishlist)}>Remove</button></div>)}</div> : <div className="mt-14 border border-charcoal/15 px-6 py-16 text-center"><p className="font-editorial text-3xl">Nothing saved yet.</p><Link className="button mt-8" to="/collection">Discover fragrances</Link></div>}</section>
}

export default WishlistPage
