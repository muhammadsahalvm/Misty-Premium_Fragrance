import api from './api'

export async function fetchProducts(params = {}) {
  const { data } = await api.get('/catalogue/products/', {
    params: { ordering: '-created_at', ...params },
  })

  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
    }
  }

  if (Array.isArray(data.results)) {
    return data
  }

  throw new Error('Catalogue products response has an invalid shape')
}

export async function fetchCategories() {
  const { data } = await api.get('/catalogue/categories/')

  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data.results)) {
    return data.results
  }

  throw new Error('Catalogue categories response has an invalid shape')
}

export async function fetchProduct(slug) {
  const { data } = await api.get(`/catalogue/products/${slug}/`)
  return data
}
