// Identité du compte grossiste connecté, utilisée pour afficher le badge
// profil (Navbar du site public + en-tête du catalogue en gros).

// Le JWT contient déjà companyName (voir POST /api/wholesale/login) : ça
// sert de repli pour les sessions ouvertes avant l'ajout de ce badge, sans
// obliger l'utilisateur à se reconnecter.
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// null si aucune session grossiste active dans ce navigateur.
export function getWholesaleAccount() {
  try {
    const stored = JSON.parse(localStorage.getItem('wholesale_account') || 'null');
    if (stored) return stored;
  } catch {
    // ignore, on retombe sur le JWT
  }
  const payload = decodeJwtPayload(localStorage.getItem('wholesale_token') || '');
  return payload?.companyName ? { company_name: payload.companyName } : null;
}

export function getWholesaleDisplayName(account) {
  const name = account?.contact_name || account?.company_name || '';
  return name.trim();
}
