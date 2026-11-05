import ImagePanel from '../components/ImagePanel'
import { Link } from 'react-router-dom'

function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1360px] px-5 py-20 sm:px-8 sm:py-32 lg:px-14">
        <p className="eyebrow">The house of Misty</p>
        <h1 className="mt-6 max-w-5xl font-editorial text-7xl leading-[0.86] tracking-[-0.03em] sm:text-9xl">Fragrance for the space between you and the world.</h1>
        <p className="mt-10 max-w-2xl text-lg leading-8 text-secondary-ink">Misty is an invitation to notice what lingers: a trace in the air, a memory returning, a personal expression that does not need to announce itself.</p>
      </section>
      <section className="mx-auto grid max-w-[1360px] gap-12 px-5 pb-24 sm:px-8 sm:pb-32 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-14">
        <ImagePanel src="/images/editorial/about-misty.webp" alt="Soft editorial still life for Misty" className="aspect-[4/5]" />
        <div className="self-center">
          <p className="eyebrow">The philosophy</p>
          <h2 className="editorial-title mt-5 max-w-xl">A scent becomes personal in the wearing.</h2>
          <p className="mt-8 max-w-lg text-base leading-8 text-secondary-ink">Fragrance can be memory, mood and identity at once. It meets the skin, the room and the moment, then changes as you do. Misty makes space for that quiet exchange.</p>
          <p className="mt-6 max-w-lg text-base leading-8 text-secondary-ink">There is no single correct way to experience a composition. The right fragrance is the one that leaves room for your own interpretation.</p>
        </div>
      </section>
      <section className="border-y border-divider bg-bone/45">
        <div className="mx-auto grid max-w-[1360px] gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:gap-24 lg:px-14">
          <div>
            <p className="eyebrow">The experience</p>
            <h2 className="editorial-title mt-5">Begin with a feeling.</h2>
          </div>
          <div className="space-y-8 text-base leading-8 text-secondary-ink">
            <p>Explore by fragrance family, follow a note that catches your attention, or start with a composition simply because its name stays with you.</p>
            <p>Each product page offers a closer look at the scent, its available variants and the notes that shape it. Take your time finding the signature that feels like yours.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1360px] gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-24 lg:px-14">
        <div>
          <p className="eyebrow">The Misty approach</p>
          <h2 className="editorial-title mt-5 max-w-xl">Thoughtful curation, without the noise.</h2>
          <p className="mt-8 max-w-lg text-base leading-8 text-secondary-ink">The Misty experience is designed to feel considered from first discovery to the moment a fragrance becomes part of your routine. Clear information, a calm visual language and room to choose at your own pace.</p>
          <Link className="mt-9 inline-flex border-b border-ink pb-2 text-xs uppercase tracking-editorial" to="/collection">Discover the collection</Link>
        </div>
        <ImagePanel src="/images/editorial/craftsmanship.webp" alt="Editorial fragrance materials and glass" className="aspect-[4/5]" />
      </section>
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-[1360px] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
          <p className="max-w-4xl font-editorial text-5xl leading-[0.95] sm:text-7xl">Find the scent that feels like a beginning.</p>
          <Link className="mt-10 inline-flex items-center border-b border-paper pb-2 text-xs uppercase tracking-editorial" to="/collection">Enter the collection</Link>
        </div>
      </section>
    </>
  )
}

export default AboutPage
