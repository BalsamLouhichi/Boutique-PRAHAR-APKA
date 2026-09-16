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

// URL d'une bannière personnalisée (tuiles "Achetez par profil"). Le
// timestamp évite que le navigateur garde en cache l'ancienne image après un
// remplacement depuis l'admin.
export function siteImageUrl(key, version) {
  const query = version ? `?v=${version}` : '';
  return `${BASE_URL}/api/settings/images/${key}${query}`;
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
    // express-validator renvoie { errors: [{ msg, path, ... }] } ; on affiche le détail.
    const validationDetail = Array.isArray(data.errors)
      ? [...new Set(data.errors.map((e) => e.msg).filter(Boolean))].join('\n')
      : '';
    throw new Error(data.error || validationDetail || `Erreur ${res.status}`);
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
  getAdminProduct: (id) => request(`/products/admin/${id}`, { auth: true }),
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
  uploadSiteImage: async (key, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BASE_URL}/api/settings/images/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Échec de l\'envoi de l\'image.');
    return res.json();
  },
  deleteSiteImage: (key) => request(`/settings/images/${key}`, { method: 'DELETE', auth: true }),

  // Commandes
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  getOrder: (id) => request(`/orders/${id}`),
  getOrders: (status = '') => request(`/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`, { auth: true }),
  getOrderItems: (id) => request(`/orders/admin/${id}/items`, { auth: true }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: { status }, auth: true }),
  updateOrderPayment: (id, payment_status) => request(`/orders/${id}/payment`, { method: 'PUT', body: { payment_status }, auth: true }),




  // Vente en gros - Public
wholesaleLogin: (email, password) =>
  request('/wholesale/login', { method: 'POST', body: { email, password } }),

wholesaleRegister: (payload) =>
  request('/wholesale/register', { method: 'POST', body: payload }),

// Vente en gros - Catalogue protégé (nécessite le token wholesale, pas admin_token)
getWholesaleProducts: async (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  const token = localStorage.getItem('wholesale_token');
  const res = await fetch(`${BASE_URL}/api/wholesale/products?${qs.toString()}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
},

wholesaleQuote: async (payload) => {
  const token = localStorage.getItem('wholesale_token');
  const res = await fetch(`${BASE_URL}/api/wholesale/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
},

// Vente en gros - Admin (utilise le admin_token existant)
getWholesaleAccounts: () => request('/wholesale/admin/accounts', { auth: true }),

updateWholesaleExclusiveAccess: (id, can_view_exclusive) =>
  request(`/wholesale/admin/accounts/${id}/exclusive-access`, { method: 'PUT', body: { can_view_exclusive }, auth: true }),

updateWholesaleAccountActive: (id, is_active) =>
  request(`/wholesale/admin/accounts/${id}/active`, { method: 'PUT', body: { is_active }, auth: true }),

};
