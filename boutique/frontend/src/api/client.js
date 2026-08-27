const BASE_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('admin_token');
}

// Si l'URL de l'image est relative (ex: /uploads/xxx.png), on la préfixe
// avec l'URL du backend. Si c'est déjà une URL complète (http...), on la
// laisse telle quelle.
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  // Public
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
    return request(`/products?${qs.toString()}`);
  },
  getProduct: (slug) => request(`/products/${slug}`),
  getCategories: () => request('/categories'),
  getSettings: () => request('/settings'),
  sendQuoteRequest: (payload) => request('/quotes', { method: 'POST', body: payload }),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  // Admin
  getAdminProducts: () => request('/products/admin/all', { auth: true }),
  getAdminCategories: () => request('/categories/admin/all', { auth: true }),
  getAdminQuotes: () => request('/quotes', { auth: true }),
  createProduct: (payload) => request('/products', { method: 'POST', body: payload, auth: true }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),
  uploadProductImages: async (id, files) => {
    const token = getToken();
    const formData = new FormData();
    [...files].forEach((f) => formData.append('images', f));
    const res = await fetch(`${BASE_URL}/api/products/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Échec de l\'envoi des images.');
    return res.json();
  },
  deleteProductImage: (imageId) => request(`/products/images/${imageId}`, { method: 'DELETE', auth: true }),
  createCategory: (payload) => request('/categories', { method: 'POST', body: payload, auth: true }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE', auth: true }),
  updateSetting: (key, value) => request(`/settings/${key}`, { method: 'PUT', body: { value }, auth: true }),
};
