import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import SectionIntro from '../components/SectionIntro'
import { fetchCategories, fetchProducts } from '../services/catalogue'

function CollectionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [state, setState] = useState('loading')
  const filters = Object.fromEntries(searchParams.entries())

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setState('loading')
    fetchProducts(filters).then((results) => { setProducts(results); setState('ready') }).catch(() => setState('error'))
  }, [searchParams.toString()])

  function update(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return <section className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-28 lg:px-16"><SectionIntro align="center" eyebrow="Misty collection" title="Fragrance, considered." description="Explore every current composition from the house of Misty." /><div className="mt-16 grid gap-12 lg:grid-cols-[220px_1fr]"><aside className="space-y-7"><div className="flex items-center gap-2 text-xs uppercase tracking-editorial"><SlidersHorizontal size={15} /> Refine</div><label className="block text-xs text-charcoal/60">Category<select className="filter" value={filters.category || ''} onChange={(e) => update('category', e.target.value)}><option value="">All categories</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label><label className="block text-xs text-charcoal/60">Fragrance family<input className="filter" value={filters.fragrance_family || ''} onChange={(e) => update('fragrance_family', e.target.value)} placeholder="e.g. floral" /></label><label className="block text-xs text-charcoal/60">Concentration<input className="filter" value={filters.concentration || ''} onChange={(e) => update('concentration', e.target.value)} placeholder="e.g. parfum" /></label><div className="grid grid-cols-2 gap-3"><input className="filter" type="number" min="0" placeholder="Min price" value={filters.min_price || ''} onChange={(e) => update('min_price', e.target.value)} /><input className="filter" type="number" min="0" placeholder="Max price" value={filters.max_price || ''} onChange={(e) => update('max_price', e.target.value)} /></div><label className="block text-xs text-charcoal/60">Sort<select className="filter" value={filters.ordering || '-created_at'} onChange={(e) => update('ordering', e.target.value)}><option value="-created_at">Newest</option><option value="price">Price: low to high</option><option value="-price">Price: high to low</option></select></label></aside><div><div className="mb-7 flex justify-between text-xs uppercase tracking-editorial text-charcoal/50"><span>{state === 'ready' ? `${products.length} fragrances` : 'Collection'}</span><button onClick={() => setSearchParams({})}>Clear filters</button></div>{state === 'loading' ? <p className="py-20 text-center text-sm text-charcoal/55">Loading the collection…</p> : null}{state === 'error' ? <p className="border border-charcoal/15 px-6 py-12 text-center text-sm text-charcoal/60">The collection is unavailable right now.</p> : null}{state === 'ready' && products.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : null}{state === 'ready' && !products.length ? <p className="border border-charcoal/15 px-6 py-12 text-center font-editorial text-2xl">No fragrances match these filters.</p> : null}</div></div></section>
}

export default CollectionPage
