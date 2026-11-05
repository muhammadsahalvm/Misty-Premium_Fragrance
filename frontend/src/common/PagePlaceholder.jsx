function PagePlaceholder({ title }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-6 py-20 text-center">
      <div>
        <p className="eyebrow">Misty</p>
        <h1 className="editorial-title mt-5">{title}</h1>
      </div>
    </section>
  )
}

export default PagePlaceholder
