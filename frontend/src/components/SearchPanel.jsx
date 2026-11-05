import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchProducts } from '../services/catalogue'
import { formatCurrency } from '../utils/formatters'
import { getLowestVariant, getPrimaryImage } from '../utils/catalogue'
import ImagePanel from './ImagePanel'

function SearchPanel({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [state, setState] = useState('idle')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function submit(event) {
    event.preventDefault()
    const value = query.trim()
    if (!value) {
      setResults([])
      setState('idle')
      return
    }
    setState('loading')
    try {
      const response = await fetchProducts({ search: value })
      setResults(response.results || [])
      setState('ready')
    } catch {
      setResults([])
      setState('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 p-0 opacity-100 transition-opacity duration-300 sm:p-6" role="dialog" aria-modal="true" aria-label="Search fragrances">
      <div className="mx-auto min-h-full max-w-4xl bg-paper px-5 py-6 shadow-2xl transition-transform duration-300 sm:min-h-0 sm:rounded-[2px] sm:px-10 sm:py-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow">Search Misty</p>
            <h2 className="mt-3 font-editorial text-4xl leading-none text-ink sm:text-5xl">Find your fragrance.</h2>
          </div>
          <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-divider text-secondary-ink transition-colors hover:border-oxblood hover:text-oxblood focus:outline-none focus:ring-1 focus:ring-oxblood" aria-label="Close search" onClick={onClose}>
            <X size={20} strokeWidth={1.3} />
          </button>
        </div>
        <form className="mt-9 flex items-center gap-3 rounded-[2px] border border-divider bg-ivory px-4 py-3 transition-colors focus-within:border-oxblood focus-within:ring-1 focus-within:ring-oxblood/30 sm:px-5 sm:py-4" onSubmit={submit}>
          <Search size={21} strokeWidth={1.2} className="shrink-0 text-oxblood" aria-hidden="true" />
          <input ref={inputRef} className="min-w-0 flex-1 bg-transparent font-sans text-base text-ink outline-none placeholder:text-secondary-ink/55 sm:text-lg" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or note" aria-label="Search fragrances" />
          {query ? <button type="button" className="rounded px-1 text-[0.62rem] uppercase tracking-editorial text-secondary-ink transition-colors hover:text-oxblood focus:outline-none focus:ring-1 focus:ring-oxblood" onClick={() => { setQuery(''); setResults([]); setState('idle'); inputRef.current?.focus() }}>Clear</button> : null}
        </form>
        <div className="mt-10">
          {state === 'idle' ? <p className="border-t border-divider py-10 text-center text-sm text-secondary-ink">Search the collection by fragrance name, family or note.</p> : null}
          {state === 'loading' ? <p className="border-t border-divider py-10 text-center text-sm text-secondary-ink">Searching the collection…</p> : null}
          {state === 'error' ? <p role="alert" className="border-t border-divider py-10 text-center text-sm text-oxblood">Search is unavailable right now. Please try again.</p> : null}
          {state === 'ready' && !results.length ? <div className="border-t border-divider py-10 text-center"><p className="font-editorial text-3xl text-ink">No fragrances found.</p><p className="mt-2 text-sm text-secondary-ink">Try another name or fragrance note.</p></div> : null}
          {results.length ? <div className="grid gap-x-8 gap-y-7 border-t border-divider pt-7 sm:grid-cols-2">{results.map((product) => { const image = getPrimaryImage(product); const variant = getLowestVariant(product); return <Link className="group flex gap-4 border-b border-divider pb-5 focus:outline-none focus:ring-1 focus:ring-oxblood" key={product.id} to={`/collection/${product.slug}`} onClick={onClose}><div className="h-28 w-24 shrink-0 bg-bone sm:h-32 sm:w-28"><ImagePanel src={image?.image_url} alt={image?.alt_text || product.name} className="h-full transition-transform duration-500 group-hover:scale-[1.03]" /></div><div className="py-1"><p className="font-editorial text-2xl leading-none text-ink sm:text-3xl">{product.name}</p><p className="mt-3 text-[0.62rem] uppercase tracking-editorial text-sage">{product.fragrance_family || 'Fine fragrance'}</p>{variant ? <p className="mt-4 text-sm text-secondary-ink">{formatCurrency(variant.price)}</p> : null}</div></Link> })}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default SearchPanel
