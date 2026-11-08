# Résidence Ebla Two — site public + espace membres

- `public/index.html` : site public (galerie, plans, vidéos, lots, avancement, contact)
- `public/espace.html` : espace connecté (admin / commercial / adhérent)
- `public/assets/config.js` : URL Supabase, clé publishable, contacts
- Backend : Supabase (projet `ebla-two`, région Paris) — tables lots, profiles, prospects, visites, echeances, documents, avancement + fonction `admin-users`.

Site statique, sans étape de build : Vercel sert le dossier `public/`.
