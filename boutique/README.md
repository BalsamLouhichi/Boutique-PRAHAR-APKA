# PRAHAR ŞAPKA — Site vitrine B2B (casquettes, bonnets, cache-cols)

Site vitrine + espace admin pour une boutique de vente en gros, sans paiement en ligne :
le client compose son panier (quantités par article) puis clique sur **"Demander un devis"**,
ce qui l'envoie sur WhatsApp avec le récapitulatif pré-rempli.

## Stack technique

| Composant | Techno |
|---|---|
| Frontend | React 19 (Vite) + Tailwind CSS v4 + React Router |
| Backend  | Node.js / Express |
| Base de données | PostgreSQL 16 |
| Auth admin | JWT + bcrypt |
| Déploiement | Docker Compose (backend, frontend/Nginx, PostgreSQL) |

## Structure du projet

```
boutique/
├── backend/          API Express (produits, catégories, auth admin, devis)
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
├── frontend/         Application React (site public + espace admin)
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── db/
│   ├── schema.sql    Schéma complet PostgreSQL
│   └── seed.sql       Données de démonstration (catégories + 6 produits)
├── docker-compose.yml
└── .env.example       Variables globales pour Docker Compose
```

---

## 1. Démarrage rapide avec Docker (recommandé)

### Prérequis
- Docker et Docker Compose installés sur votre machine ou votre VPS

### Étapes

1. **Copier et remplir le fichier d'environnement** :
   ```bash
   cp .env.example .env
   ```
   Éditez `.env` et renseignez :
   - `DB_PASSWORD` : mot de passe PostgreSQL fort
   - `JWT_SECRET` : générez une valeur aléatoire avec `openssl rand -base64 48`
   - `CORS_ORIGINS` : le(s) domaine(s) HTTPS de votre site en production

2. **Lancer les conteneurs** :
   ```bash
   docker compose up -d --build
   ```
   Cela démarre PostgreSQL (avec le schéma + les données de démo importés automatiquement lors de la première création du volume),
   l'API backend, et le frontend servi par Nginx sur le port défini (`HTTP_PORT`, 80 par défaut).

3. **Créer votre vrai compte admin** (le compte de démo n'est pas utilisable tel quel) :
   ```bash
   docker compose exec backend node src/scripts/hashPassword.js "VotreMotDePasseFort!"
   ```
   Copiez le hash affiché, puis connectez-vous à PostgreSQL pour l'insérer :
   ```bash
   docker compose exec db psql -U postgres -d boutique -c \
     "UPDATE admin_users SET password_hash='<HASH_COPIÉ>', email='votre-email@exemple.com' WHERE email='admin@boutique.tn';"
   ```

4. **Configurer votre numéro WhatsApp et vos textes** :
   Les réglages du site se modifient directement via l'API protégée ou dans PostgreSQL :
   ```bash
   docker compose exec db psql -U postgres -d boutique -c \
     "UPDATE site_settings SET value='21620000000' WHERE key='whatsapp_number';"
   ```
   Format attendu pour WhatsApp : indicatif pays + numéro, sans espaces ni "+" (ex: `21620000000` pour la Tunisie).
   Les autres clés disponibles comprennent notamment `brand_tagline` et `brand_description`.

5. **Accéder au site** :
   - Site public : `http://localhost` (ou votre domaine)
   - Espace admin : `http://localhost/admin/login`

### Mettre le site à jour
```bash
git pull
docker compose up -d --build
```

---

## 2. Déploiement en production sur un VPS

1. Pointez votre nom de domaine (A record) vers l'IP de votre VPS.
2. Installez Docker + Docker Compose sur le VPS.
3. Copiez le dossier du projet sur le serveur (`git clone` ou `scp`).
4. Suivez les étapes de la section 1 ci-dessus.
5. **Ajoutez HTTPS** : la config Nginx fournie sert du HTTP simple. En production, mettez un
   reverse proxy devant (ex: [Caddy](https://caddyserver.com/) ou Nginx + Certbot) pour
   obtenir un certificat Let's Encrypt automatiquement, ou utilisez un service comme
   Cloudflare en mode proxy avec "Full" SSL.

   Exemple simple avec Caddy en frontal (fichier `Caddyfile`) :
   ```
   votredomaine.com {
       reverse_proxy localhost:80
   }
   ```
   Caddy gère alors automatiquement le certificat HTTPS.

6. Pensez à **sauvegarder régulièrement la base de données** :
   ```bash
   docker compose exec db pg_dump -U postgres boutique > backup_$(date +%F).sql
   ```

---

## 3. Développement local (sans Docker)

### Backend
```bash
cd backend
   cp .env.example .env   # sous Windows, copier .env.example vers .env manuellement
npm install
# Créer la base PostgreSQL localement puis :
psql -U postgres -d boutique -f ../db/schema.sql
psql -U postgres -d boutique -f ../db/seed.sql
npm run hash-password -- "Admin123!"   # récupérer le hash et l'insérer en base
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_URL vide en dev (proxifié par Vite vers localhost:4000)
npm install
npm run dev
```
Le site est alors disponible sur `http://localhost:5173`.

---

## 4. Sécurité mise en place

- **Mots de passe admin** hashés avec bcrypt (jamais stockés en clair)
- **JWT** avec expiration (8h) pour les sessions admin
- **Rate limiting** : global sur l'API + limite stricte sur la route de connexion (anti brute-force)
- **Helmet** : en-têtes HTTP de sécurité (CSP de base, anti-clickjacking, etc.)
- **CORS restreint** aux domaines listés dans `CORS_ORIGINS`
- **Validation des entrées** (express-validator) sur toutes les routes qui écrivent en base
- **Upload d'images** : types de fichiers whitelistés (jpeg/png/webp), taille max 5 Mo,
  noms de fichiers aléatoires (empêche l'exécution de scripts uploadés)
- **Requêtes SQL paramétrées** partout (protection contre les injections SQL)
- **Conteneurs non-root** pour le backend
- Aucune donnée de paiement n'est jamais collectée (le site ne fait que rediriger vers WhatsApp)

### À faire vous-même avant la mise en production
- [ ] Changer `JWT_SECRET` et `DB_PASSWORD` (ne jamais garder les valeurs d'exemple)
- [ ] Créer votre compte admin réel et supprimer/désactiver le compte de démonstration
- [ ] Activer HTTPS (voir section 2)
- [ ] Configurer des sauvegardes automatiques de la base PostgreSQL

---

## 5. Gestion des articles (espace admin)

Depuis `/admin`, vous pouvez :
- Créer / modifier / supprimer des articles (nom, description, catégorie, saison, genre,
  couleurs, tailles, matière, quantité minimale de commande)
- Uploader plusieurs photos par article
- Remplacer la photo principale d'un article ou supprimer une image
- Marquer un article comme "Nouveauté" (affiché dans le carrousel homepage) ou "Mise en avant"
- Activer/désactiver la visibilité d'un article sans le supprimer

Les catégories (Casquettes, Bonnets, Cache-cols, Écharpes...) sont gérables depuis l'écran admin
`/admin/categories` ou via l'API `/api/categories`.

## 6. Filtres disponibles côté client

- **Catégorie** (dynamique, basée sur la table `categories`)
- **Saison** : Hiver / Été / Printemps / Automne / Toutes saisons
- **Genre** : Homme / Femme / Enfant / Unisexe
- **Nouveautés uniquement**
- **Recherche texte** (nom / description)

Le panneau de filtres est fixe à gauche sur desktop, et glisse depuis la gauche sur mobile.
