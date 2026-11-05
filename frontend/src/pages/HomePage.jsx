import { ArrowDown, ArrowRight, Instagram, Mail, MoveUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import ImagePanel from '../components/ImagePanel'
import ProductCard from '../components/ProductCard'
import SectionIntro from '../components/SectionIntro'
import { fetchCategories, fetchProducts } from '../services/catalogue'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { getPrimaryImage } from '../utils/catalogue'

function ProductState({ state }) {
  if (state === 'loading') {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div className="animate-pulse" key={item}>
            <div className="aspect-[4/5] bg-beige" />
            <div className="mt-5 h-5 w-2/3 bg-beige" />
            <div className="mt-3 h-3 w-1/3 bg-beige" />
          </div>
        ))}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="border border-charcoal/15 px-6 py-12 text-center">
        <p className="font-editorial text-2xl">The collection is taking a quiet moment.</p>
        <p className="mt-3 text-sm text-charcoal/60">
          Please return shortly to discover the current fragrances.
        </p>
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

    Promise.allSettled([fetchProducts(), fetchCategories()]).then(
      ([productResult, categoryResult]) => {
        if (!active) return

        if (productResult.status === 'fulfilled') {
          setProducts(productResult.value)
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
      },
    )

    return () => {
      active = false
    }
  }, [])

  const featuredProducts = products.filter((product) => product.is_featured).slice(0, 4)
  const productsToShow = featuredProducts.length ? featuredProducts : products.slice(0, 4)
  const heroProduct = productsToShow[0]
  const editorialProduct = productsToShow[1]
  const storyProduct = productsToShow[2]
  const heroImage = getPrimaryImage(heroProduct)?.image_url
  const editorialImage = getPrimaryImage(editorialProduct)?.image_url
  const storyImage = getPrimaryImage(storyProduct)?.image_url

  return (
    <>
      <section className="relative overflow-hidden border-b border-charcoal/10">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-6 py-14 sm:px-10 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-16 lg:py-24">
          <div className="relative z-10 max-w-xl">
            <p className="eyebrow">{heroProduct?.fragrance_family || 'Misty / Fine fragrance'}</p>
            <h1 className="mt-7 max-w-xl font-editorial text-5xl leading-[0.94] tracking-[-0.04em] text-charcoal sm:text-7xl lg:text-[5.75rem]">
              {heroProduct?.name || 'A fragrance made to linger.'}
            </h1>
            <p className="mt-8 max-w-md text-sm leading-7 text-charcoal/65 sm:text-base">
              {heroProduct?.short_description || 'Fragrance compositions for the spaces between moments — made to be worn close, remembered slowly, and found entirely your own.'}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-7">
              <Link
                className="inline-flex items-center gap-4 border-b border-charcoal pb-3 text-[0.65rem] uppercase tracking-editorial transition-colors hover:border-champagne hover:text-champagne"
                to="/#collection"
              >
                Explore collection <ArrowRight size={15} strokeWidth={1.2} />
              </Link>
              <Link
                className="text-[0.65rem] uppercase tracking-editorial text-charcoal/55 transition-colors hover:text-charcoal"
                to="/#about"
              >
                Discover our story
              </Link>
            </div>
          </div>
          <div className="relative min-h-[480px] sm:min-h-[640px]">
            <ImagePanel src={heroImage} alt={heroProduct?.name || 'Misty fragrance'} className="absolute inset-0" />
            <div className="absolute inset-5 border border-ivory/50 sm:inset-8" />
            <p className="absolute bottom-7 left-7 text-[0.6rem] uppercase tracking-editorial text-ivory/75">
              {heroProduct ? `${heroProduct.name} / ${heroProduct.concentration || 'Fine fragrance'}` : 'Misty / Fine fragrance'}
            </p>
          </div>
        </div>
        <a className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[0.6rem] uppercase tracking-editorial text-charcoal/50 lg:flex" href="#collection">
          Scroll to discover <ArrowDown size={14} strokeWidth={1.2} />
        </a>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-24 lg:px-16">
        <div className="order-2 lg:order-1">
          <p className="eyebrow">The art of atmosphere</p>
          <h2 className="editorial-title mt-5 max-w-md">A scent can hold an entire room.</h2>
          <p className="mt-7 max-w-md text-sm leading-7 text-charcoal/65 sm:text-base">
            We compose in contrasts: mineral and skin, shadow and light, a
            fleeting note that stays with you long after the door has closed.
          </p>
          <Link className="mt-9 inline-flex items-center gap-3 text-[0.65rem] uppercase tracking-editorial text-charcoal hover:text-champagne" to="/#about">
            The Misty approach <MoveUpRight size={15} strokeWidth={1.2} />
          </Link>
        </div>
        <ImagePanel src={editorialImage} alt={editorialProduct?.name || 'Misty fragrance'} className="order-1 aspect-[4/3] lg:order-2 lg:aspect-[5/4]" />
      </section>

      {heroProduct ? (
        <section className="border-y border-charcoal/10 bg-beige/30">
          <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-16">
            <ImagePanel src={heroImage} alt={heroProduct.name} className="aspect-[5/4]" />
            <div className="max-w-md">
              <p className="eyebrow">Featured fragrance</p>
              <h2 className="editorial-title mt-5">{heroProduct.name}</h2>
              <p className="mt-3 text-[0.65rem] uppercase tracking-editorial text-charcoal/50">{heroProduct.concentration || 'Fine fragrance'}</p>
              <p className="mt-7 text-sm leading-7 text-charcoal/65">{heroProduct.description || heroProduct.short_description}</p>
              <Link className="mt-8 inline-flex items-center gap-3 border-b border-charcoal pb-2 text-[0.65rem] uppercase tracking-editorial" to={`/collection/${heroProduct.slug}`}>
                View fragrance <MoveUpRight size={15} strokeWidth={1.2} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section id="collection" className="bg-beige/45">
        <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <SectionIntro
              eyebrow="The collection"
              title="Fragrance, considered."
              description="Discover the current Misty compositions, each one made to settle differently on every skin."
            />
            <Link className="inline-flex items-center gap-3 text-[0.65rem] uppercase tracking-editorial text-charcoal hover:text-champagne" to="/collection">
              View all fragrances <ArrowRight size={15} strokeWidth={1.2} />
            </Link>
          </div>
          <div className="mt-14">
            <ProductState state={catalogueState} />
            {catalogueState === 'ready' && productsToShow.length ? (
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {productsToShow.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : null}
            {catalogueState === 'ready' && !productsToShow.length ? (
              <div className="border border-charcoal/15 px-6 py-12 text-center">
                <p className="font-editorial text-2xl">The first compositions are being prepared.</p>
                <p className="mt-3 text-sm text-charcoal/60">Return soon to explore the Misty collection.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {categoryState === 'ready' && categories.length ? (
        <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
          <SectionIntro
            align="center"
            eyebrow="Find your atmosphere"
            title="Begin with a feeling."
            description="Explore the families that shape the Misty palette."
          />
          <div className="mt-14 grid gap-px border border-charcoal/15 bg-charcoal/15 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 6).map((category, index) => (
              <Link className="group bg-ivory p-8 transition-colors hover:bg-beige sm:p-10" key={category.id} to={`/collection?category=${category.slug}`}>
                <span className="text-[0.62rem] tracking-editorial text-champagne">0{index + 1}</span>
                <div className="mt-12 flex items-end justify-between gap-5">
                  <div>
                    <h3 className="font-editorial text-3xl">{category.name}</h3>
                    {category.description ? <p className="mt-3 max-w-xs text-sm leading-6 text-charcoal/55">{category.description}</p> : null}
                  </div>
                  <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} strokeWidth={1.2} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="about" className="bg-charcoal text-ivory">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-24 lg:px-16">
          <ImagePanel src={storyImage} alt={storyProduct?.name || 'A Misty perfume bottle in soft shadow'} className="aspect-[4/5] max-h-[680px]" position="center" />
          <div>
            <p className="text-[0.65rem] uppercase tracking-editorial text-champagne-soft">The Misty philosophy</p>
            <h2 className="mt-6 max-w-lg font-editorial text-5xl leading-[0.98] tracking-[-0.03em] sm:text-6xl">
              Made for the space between you and the world.
            </h2>
            <p className="mt-8 max-w-md text-sm leading-7 text-ivory/65 sm:text-base">
              Misty is an invitation to slow down and notice what lingers.
              Our fragrances are shaped with restraint: distinctive enough to
              leave a memory, quiet enough to become part of yours.
            </p>
            <p className="mt-10 max-w-md border-l border-champagne pl-5 font-editorial text-2xl leading-tight text-ivory/85">
              “The most personal thing you wear is often the thing no one can see.”
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Instagram className="mx-auto text-champagne" size={20} strokeWidth={1.2} />
          <p className="eyebrow mt-6">A note from Misty</p>
          <p className="mt-7 font-editorial text-3xl leading-tight text-charcoal sm:text-5xl">
            “Fragrance is not an announcement. It is the memory someone carries away.”
          </p>
          <p className="mt-6 text-[0.65rem] uppercase tracking-editorial text-charcoal/45">
            The house philosophy
          </p>
        </div>
      </section>

      <section className="border-y border-charcoal/10 bg-beige/35">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-16 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <div>
            <p className="eyebrow">The Misty journal</p>
            <h2 className="mt-4 font-editorial text-4xl">Notes on scent, sent occasionally.</h2>
          </div>
          <div className="flex w-full max-w-md items-center gap-4 border-b border-charcoal/35 pb-3">
            <Mail size={17} strokeWidth={1.2} className="text-charcoal/50" />
            <span className="flex-1 text-sm text-charcoal/45">Your email address</span>
            <button type="button" className="text-[0.62rem] uppercase tracking-editorial text-charcoal hover:text-champagne">
              Join
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

export default HomePage
