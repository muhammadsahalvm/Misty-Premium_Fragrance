export function getPrimaryImage(product) {
  if (!product) {
    return null
  }

  return product.images?.find((image) => image.is_primary) || product.images?.[0]
}

export function getLowestVariant(product) {
  return product.variants
    ?.filter((variant) => variant.is_active)
    .reduce((lowest, variant) => {
      if (!lowest || Number(variant.price) < Number(lowest.price)) {
        return variant
      }

      return lowest
    }, null)
}
