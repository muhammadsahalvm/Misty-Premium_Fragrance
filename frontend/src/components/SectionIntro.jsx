function SectionIntro({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="editorial-title mt-5">{title}</h2>
      {description ? (
        <p className="mt-6 max-w-lg text-sm leading-7 text-charcoal/65 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export default SectionIntro
