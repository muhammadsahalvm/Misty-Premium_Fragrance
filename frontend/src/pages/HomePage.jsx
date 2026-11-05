import { ArrowRight, ChevronDown, MoveUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import ImagePanel from '../components/ImagePanel'
import ProductCard from '../components/ProductCard'
import { fetchCategories, fetchProducts } from '../services/catalogue'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { getPrimaryImage } from '../utils/catalogue'

const editorial = {
  hero: '/images/editorial/hero-fragrance1.webp',
  about: '/images/editorial/about-misty.webp',
  craftsmanship: '/images/editorial/craftsmanship.webp',
  notes: '/images/editorial/fragrance-notes.webp',
  oriental: '/images/editorial/oriental.webp',
  journal: '/images/editorial/journal-01.webp',
}

function ProductState({ state }) {
  if (state === 'loading') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div className="animate-pulse" key={item}>
            <div className="aspect-[4/5] bg-bone" />
            <div className="mt-5 h-5 w-2/3 bg-bone" />
            <div className="mt-3 h-3 w-1/3 bg-bone" />
          </div>
        ))}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="border border-divider px-6 py-12 text-center">
        <p className="font-editorial text-3xl">The collection is taking a quiet moment.</p>
        <p className="mt-3 text-sm text-secondary-ink">Please return shortly to discover the current fragrances.</p>
      </div>
    )
  }

  return null
}

function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [catalogueState, setCatalogueState] = useState('loading')
  const [categoryState, setCategoryState] = useState('loading')

  useDocumentTitle('Misty — Fine Fragrance')

  useEffect(() => {
    let active = true
    Promise.allSettled([fetchProducts(), fetchCategories()]).then(([productResult, categoryResult]) => {
      if (!active) return
      if (productResult.status === 'fulfilled') {
        setProducts(productResult.value.results || productResult.value)
        setCatalogueState('ready')
      } else {
        setCatalogueState('error')
      }
      if (categoryResult.status === 'fulfilled') {
        setCategories(categoryResult.value)
        setCategoryState('ready')
      } else {
        setCategoryState('error')
      }
    })
    return () => { active = false }
  }, [])

  const featuredProducts = products.filter((product) => product.is_featured)
  const featuredProduct = featuredProducts[0] || products[0]
  const collectionProducts = featuredProducts.slice(0, 4).length
    ? featuredProducts.slice(0, 4)
    : products.slice(0, 4)
  const primaryImage = getPrimaryImage(featuredProduct)
  const notes = [
    ['Top notes', featuredProduct?.top_notes],
    ['Middle notes', featuredProduct?.middle_notes],
    ['Base notes', featuredProduct?.base_notes],
  ]

  return (
    <>
      <section className="relative min-h-[min(88vh,820px)] overflow-hidden bg-ink text-paper">
        <ImagePanel src={editorial.hero} alt="Misty fragrance bottle in soft light" className="absolute inset-0 h-full bg-ink" position="center" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-ink/20" />
        <div className="relative mx-auto flex min-h-[min(88vh,820px)] max-w-[1360px] flex-col justify-end px-5 pb-12 sm:px-8 sm:pb-16 lg:px-14 lg:pb-20">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <p className="text-[0.68rem] uppercase tracking-editorial text-bone">Misty / Fine fragrance</p>
              <h1 className="mt-5 max-w-5xl font-editorial text-7xl leading-[0.8] tracking-[-0.03em] sm:text-9xl lg:text-[clamp(7rem,15vw,13rem)]">Composed<br />slowly.</h1>
            </div>
            <div className="max-w-sm">
              <p className="text-base leading-7 text-bone/85">Fragrance for the space between you and the world.</p>
              <Link className="mt-7 inline-flex items-center gap-3 rounded-[2px] bg-paper px-6 py-4 text-xs font-medium uppercase tracking-editorial text-ink transition-colors hover:bg-bone" to="/collection">
                Explore the collection <ArrowRight size={15} strokeWidth={1.2} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Find your expression</p>
            <h2 className="editorial-title mt-5 max-w-2xl">A scent for every atmosphere.</h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-secondary-ink">Begin with the fragrance family that speaks to you, then discover the compositions within it.</p>
        </div>
        {categoryState === 'ready' && categories.length ? (
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {categories.slice(0, 3).map((category, index) => (
              <Link className="group relative overflow-hidden rounded-[2px] bg-bone" key={category.id} to={`/collection?category=${category.slug}`}>
                <div className="aspect-[3/4]">
                  <ImagePanel src={[editorial.about, editorial.notes, editorial.oriental][index]} alt={`${category.name} fragrance atmosphere`} className="h-full transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/75 to-transparent px-6 pb-6 pt-20 text-paper">
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-editorial text-bone/75">0{index + 1}</span>
                    <h3 className="mt-3 font-editorial text-4xl">{category.name}</h3>
                  </div>
                  <ArrowRight size={18} strokeWidth={1.2} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : categoryState === 'loading' ? (
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div className="aspect-[3/4] animate-pulse bg-bone" key={item} />)}
          </div>
        ) : (
          <p className="mt-14 border border-divider px-6 py-12 text-center text-sm text-secondary-ink">Fragrance families will appear here when the catalogue is available.</p>
        )}
      </section>

      <section className="border-y border-divider bg-bone/45">
        <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_0.9fr] lg:gap-24 lg:px-14">
          <ImagePanel src={primaryImage?.image_url} alt={primaryImage?.alt_text || featuredProduct?.name || 'Featured Misty fragrance'} className="aspect-[4/5] max-h-[700px] bg-bone" />
          <div>
            <p className="eyebrow">Featured fragrance</p>
            <h2 className="mt-5 max-w-xl font-editorial text-6xl leading-[0.9] tracking-[-0.02em] sm:text-8xl">{featuredProduct?.name || 'A fragrance to discover.'}</h2>
            <p className="mt-5 text-xs uppercase tracking-editorial text-sage">{featuredProduct?.concentration || 'Fine fragrance'}</p>
            <p className="mt-8 max-w-md text-base leading-7 text-secondary-ink">{featuredProduct?.description || featuredProduct?.short_description || 'Explore the current Misty composition and discover its character.'}</p>
            {featuredProduct ? <Link className="mt-8 inline-flex items-center gap-3 border-b border-ink pb-2 text-xs uppercase tracking-editorial" to={`/collection/${featuredProduct.slug}`}>Discover this fragrance <MoveUpRight size={15} strokeWidth={1.2} /></Link> : null}
          </div>
        </div>
      </section>

      <section className="bg-oxblood text-paper">
        <div className="mx-auto max-w-[1360px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[0.68rem] uppercase tracking-editorial text-bone/75">Fragrance notes</p>
              <h2 className="mt-5 max-w-xl font-editorial text-6xl leading-[0.9] sm:text-8xl">Read the composition.</h2>
            </div>
            <p className="max-w-md text-base leading-7 text-bone/80">A closer look at the notes of the featured Misty composition.</p>
          </div>
          <div className="mt-16 grid border-t border-paper/25 md:grid-cols-3">
            {notes.map(([label, value]) => (
              <div className="border-b border-paper/15 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0" key={label}>
                <p className="font-editorial text-4xl">{value || 'To be discovered'}</p>
                <p className="mt-3 text-xs uppercase tracking-editorial text-bone/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1360px] gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 lg:px-14">
        <ImagePanel src={editorial.craftsmanship} alt="Misty fragrance materials and glass in warm light" className="aspect-[3/4] max-h-[720px]" />
        <div className="self-center">
          <p className="eyebrow">Why Misty</p>
          <h2 className="editorial-title mt-5 max-w-xl">Notice what lingers.</h2>
          <p className="mt-7 max-w-lg text-base leading-7 text-secondary-ink">Misty is an invitation to slow down and notice the details that make a fragrance feel personal.</p>
          <div className="mt-12 border-t border-divider">
            {['A quiet visual language.', 'Compositions selected with restraint.', 'Room for your own interpretation.'].map((item, index) => (
              <div className="flex gap-6 border-b border-divider py-6" key={item}>
                <span className="text-xs text-brass">0{index + 1}</span>
                <p className="font-editorial text-3xl">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-divider bg-bone/40">
        <div className="mx-auto grid max-w-[1360px] gap-10 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-14">
          <div>
            <p className="eyebrow">From the journal</p>
            <h2 className="editorial-title mt-5 max-w-lg">Notes on scent and atmosphere.</h2>
            <p className="mt-7 max-w-md text-base leading-7 text-secondary-ink">A visual space for future Misty editorial stories.</p>
            <Link className="mt-8 inline-flex items-center gap-3 border-b border-ink pb-2 text-xs uppercase tracking-editorial" to="/about">Read more <MoveUpRight size={15} strokeWidth={1.2} /></Link>
          </div>
          <ImagePanel src={editorial.journal} alt="Editorial still life for the Misty journal" className="aspect-[5/4]" />
        </div>
      </section>

      <section className="mx-auto max-w-[1360px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="editorial-title mt-5">A little clarity.</h2>
          </div>
          <div>
            {[
              ['How do I explore the collection?', 'Begin with the Shop page or choose a fragrance family above. Each product page includes its available sizes and notes.'],
              ['Can I visit the fragrance again later?', 'Save a fragrance to your wishlist when signed in, or return to its product page from the collection.'],
              ['Where can I find order information?', 'Signed-in customers can view their orders and account details from the account area.'],
            ].map(([question, answer]) => (
              <details className="group border-t border-divider py-6 last:border-b" key={question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-editorial text-3xl">{question}<ChevronDown size={20} strokeWidth={1.2} className="transition-transform group-open:rotate-180" /></summary>
                <p className="max-w-2xl pt-3 text-sm leading-7 text-secondary-ink">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div>
            <p className="text-[0.68rem] uppercase tracking-editorial text-brass">The Misty journal</p>
            <h2 className="mt-4 font-editorial text-5xl">Notes on scent, sent occasionally.</h2>
          </div>
          <div className="w-full max-w-md border-b border-paper/40 pb-3 text-sm text-bone/70" aria-label="Newsletter sign-up preview">
            Enter your email to hear from Misty
          </div>
        </div>
      </section>

      <section id="collection" className="mx-auto max-w-[1360px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 className="editorial-title mt-5">Fragrance, considered.</h2>
          </div>
          <Link className="inline-flex items-center gap-3 text-xs uppercase tracking-editorial" to="/collection">View all fragrances <ArrowRight size={15} strokeWidth={1.2} /></Link>
        </div>
        <div className="mt-14">
          <ProductState state={catalogueState} />
          {catalogueState === 'ready' && collectionProducts.length ? <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{collectionProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : null}
          {catalogueState === 'ready' && !collectionProducts.length ? <div className="border border-divider px-6 py-12 text-center"><p className="font-editorial text-3xl">The collection is being prepared.</p></div> : null}
        </div>
      </section>
    </>
  )
}

export default HomePage
