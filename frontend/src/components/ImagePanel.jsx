import { useState } from 'react'

function ImagePanel({ src, alt, className = '', position = 'center' }) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`overflow-hidden bg-beige ${className}`}>
      {hasError || !src ? (
        <div className="flex h-full w-full items-end bg-beige p-8" role="img" aria-label={`${alt} unavailable`}>
          <span className="font-editorial text-3xl text-charcoal/35">MISTY</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ objectPosition: position }}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  )
}

export default ImagePanel
