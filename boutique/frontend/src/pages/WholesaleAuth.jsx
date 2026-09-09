import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function WholesaleAuth() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const navigate = useNavigate();

  // --- Connexion ---
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const { token } = await api.wholesaleLogin(loginForm.email, loginForm.password);
      localStorage.setItem('wholesale_token', token);
      navigate('/gros/catalogue');
    } catch (err) {
      setLoginError(err.message || 'Connexion échouée.');
    } finally {
      setLoginLoading(false);
    }
  }

  // --- Inscription ---
  const [regForm, setRegForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '', password: '',
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  function updateReg(field, value) {
    setRegForm((f) => ({ ...f, [field]: value }));
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      const result = await api.wholesaleRegister(regForm);
      setRegSuccess(result.message || 'Votre demande a été envoyée avec succès.');
    } catch (err) {
      setRegError(err.message || 'Erreur lors de l\u2019inscription.');
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-[var(--color-line)] w-full max-w-md p-8">
        <Link to="/" className="text-sm text-[var(--color-muted)] hover:underline mb-4 inline-block">← Retour au site</Link>
        <h1 className="font-display text-2xl mb-1">Espace grossiste</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Accès réservé aux boutiques et revendeurs.</p>

        <div className="flex border-b border-[var(--color-line)] mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 pb-3 text-sm font-medium ${tab === 'login' ? 'border-b-2 border-[var(--color-amber)] text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}
          >
            Se connecter
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 pb-3 text-sm font-medium ${tab === 'register' ? 'border-b-2 border-[var(--color-amber)] text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}
          >
            Créer un compte
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loginError}</p>}
            <div>
              <label className="block text-sm font-medium mb-1">Email professionnel</label>
              <input required type="email" name="email" autoComplete="username" value={loginForm.email} onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe</label>
              <input required type="password" name="password" autoComplete="current-password" value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loginLoading}
              className="w-full bg-[var(--color-ink)] text-white font-semibold py-2.5 rounded-lg hover:bg-[var(--color-ink-light)] transition-colors disabled:opacity-60">
              {loginLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : regSuccess ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[var(--color-sage)] text-white flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <p className="text-sm text-[var(--color-ink)] font-medium mb-2">Demande envoyée</p>
            <p className="text-sm text-[var(--color-muted)]">{regSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {regError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-line">{regError}</p>}
            <div>
              <label className="block text-sm font-medium mb-1">Nom de l'entreprise / boutique</label>
              <input required name="organization" autoComplete="organization" value={regForm.company_name} onChange={(e) => updateReg('company_name', e.target.value)}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom du contact</label>
              <input required name="name" autoComplete="name" value={regForm.contact_name} onChange={(e) => updateReg('contact_name', e.target.value)}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email professionnel</label>
              <input required type="email" name="email" autoComplete="email" value={regForm.email} onChange={(e) => updateReg('email', e.target.value)}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input required type="tel" name="tel" autoComplete="tel" value={regForm.phone} onChange={(e) => updateReg('phone', e.target.value)}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe (min. 8 caractères)</label>
              <input required type="password" name="new-password" autoComplete="new-password" minLength={8} value={regForm.password} onChange={(e) => updateReg('password', e.target.value)}
                className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Votre compte sera créé immédiatement. L'administrateur pourra ensuite gérer votre accès aux articles exclusifs.
            </p>
            <button type="submit" disabled={regLoading}
              className="w-full bg-[var(--color-amber)] hover:bg-[var(--color-amber-dark)] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              {regLoading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
