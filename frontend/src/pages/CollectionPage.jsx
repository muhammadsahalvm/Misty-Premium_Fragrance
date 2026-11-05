import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import ProductCard from '../components/ProductCard'
import SectionIntro from '../components/SectionIntro'
import { fetchCategories, fetchProducts } from '../services/catalogue'

const PRICE_MIN = 0
const PRICE_MAX = 10000
const PRICE_STEP = 100

function CollectionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null })
  const [categories, setCategories] = useState([])
  const [state, setState] = useState('loading')
  const filters = Object.fromEntries(searchParams.entries())
  const query = searchParams.toString()
  const currentPage = Number(searchParams.get('page') || 1)
  const totalPages = pagination.count ? Math.ceil(pagination.count / 12) : 0
  const selectedMin = Number(filters.min_price || PRICE_MIN)
  const selectedMax = Number(filters.max_price || PRICE_MAX)

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setState('loading')
    fetchProducts(filters)
      .then((response) => {
        setProducts(response.results)
        setPagination({ count: response.count || 0, next: response.next, previous: response.previous })
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [query])

  function update(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  function updatePrice(key, value) {
    const numericValue = Number(value)
    if (key === 'min_price') update(key, String(Math.min(numericValue, selectedMax)))
    else update(key, String(Math.max(numericValue, selectedMin)))
  }

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-14">
      <SectionIntro align="center" eyebrow="Misty collection" title="Fragrance, considered." description="Explore every current composition from the house of Misty." />
      <div className="mt-12 grid gap-12 lg:grid-cols-[230px_1fr]">
        <aside className="space-y-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-editorial text-secondary-ink"><SlidersHorizontal size={15} /> Refine</div>
          <label className="block text-xs text-secondary-ink">Category
            <select className="filter" value={filters.category || ''} onChange={(event) => update('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="block text-xs text-secondary-ink">Fragrance family
            <input className="filter" value={filters.fragrance_family || ''} onChange={(event) => update('fragrance_family', event.target.value)} placeholder="e.g. floral" />
          </label>
          <label className="block text-xs text-secondary-ink">Concentration
            <input className="filter" value={filters.concentration || ''} onChange={(event) => update('concentration', event.target.value)} placeholder="e.g. EDP" />
          </label>
          <div>
            <div className="flex justify-between text-xs text-secondary-ink"><span>Price</span><span>{selectedMin} – {selectedMax >= PRICE_MAX ? `${PRICE_MAX}+` : selectedMax}</span></div>
            <div className="mt-4 space-y-3">
              <input aria-label="Minimum price" className="price-range" type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={selectedMin} onChange={(event) => updatePrice('min_price', event.target.value)} />
              <input aria-label="Maximum price" className="price-range" type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={selectedMax} onChange={(event) => updatePrice('max_price', event.target.value)} />
            </div>
          </div>
          <label className="block text-xs text-secondary-ink">Sort
            <select className="filter" value={filters.ordering || '-created_at'} onChange={(event) => update('ordering', event.target.value)}>
              <option value="-created_at">Newest</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
            </select>
          </label>
        </aside>
        <div>
          <div className="mb-7 flex flex-wrap justify-between gap-4 text-xs uppercase tracking-editorial text-secondary-ink/70">
            <span>{state === 'ready' ? `${pagination.count || products.length} fragrances` : 'Collection'}</span>
            <button type="button" className="text-ink underline underline-offset-4" onClick={() => setSearchParams({})}>Clear filters</button>
          </div>
          {state === 'loading' ? <p className="py-20 text-center text-sm text-secondary-ink">Loading the collection…</p> : null}
          {state === 'error' ? <p role="alert" className="border border-divider px-6 py-12 text-center text-sm text-oxblood">The collection is unavailable right now.</p> : null}
          {state === 'ready' && products.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : null}
          {state === 'ready' && !products.length ? <p className="border border-divider px-6 py-12 text-center font-editorial text-3xl">No fragrances match these filters.</p> : null}
          {state === 'ready' && totalPages > 1 ? <nav className="mt-12 flex items-center justify-center gap-6 text-xs uppercase tracking-editorial" aria-label="Collection pages"><button type="button" disabled={!pagination.previous} onClick={() => update('page', String(currentPage - 1))}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={!pagination.next} onClick={() => update('page', String(currentPage + 1))}>Next</button></nav> : null}
        </div>
      </div>
    </section>
  )
}

export default CollectionPage
