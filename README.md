# nathancouton.fr — v2

Portfolio de Nathan Couton, refonte en **Nuxt 4** du site
[nath7098/personal-website](https://gitlab.com/nath7098/personal-website) (Vue 3 + Vite).

La navigation est une **page unique à défilement horizontal** : on scrolle, le contenu
file de gauche à droite à travers sept scènes. Parallax multi-couches, particules
canvas et transitions CSS sur mesure — aucune librairie de composants UI.

> **La spécification fait foi : [`docs/SPEC.md`](docs/SPEC.md).**
> Elle décrit le rail, le design system, chaque scène, les budgets et le plan de lots.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production (preset Vercel, prérendu `/` et `/en`) |
| `npm run preview` | sert le build localement |
| `npm run lint` / `lint:fix` | ESLint (config Nuxt + stylistic) |
| `npm run typecheck` | `vue-tsc` en mode strict |
| `npm run test` | tests unitaires Vitest |
| `npm run check` | lint + typecheck + tests, comme la CI |

| `npm run smoke` | charge le build réel dans Chromium et échoue sur toute erreur |
| `npm run verify` | la séquence complète, comme la CI |
| `npm run icons` | régénère `public/sprite.svg` et `app/utils/icon-names.ts` |

`npm run smoke` exige un `npm run build` préalable. En local, `CHROMIUM_PATH`
permet de pointer un binaire Chromium déjà présent.

## Architecture

```
app/
├── assets/css/     tokens, reset, typographie, breakpoints nommés
├── components/     primitives/ · rail/ · effects/ · scenes/
├── composables/    useRail, useMotionPreference, …
├── data/           scènes, projets, compétences, contact (TypeScript typé)
└── pages/index.vue page unique, monte les sept scènes
i18n/locales/       fr.json (défaut) · en.json
server/api/         contact.post.ts — unique fonction serverless
```

La galerie de composants vit sur `/_dev/kitchen-sink` en développement. Sa route
est retirée du build de production, elle ne coûte donc rien au bundle livré.

## Conventions

- **Aucune dépendance de composants UI.** Tout est écrit à la main (SPEC §7).
- **CSS natif** : nesting, `color-mix()`, custom properties. Pas de préprocesseur.
  Les breakpoints nommés vivent dans `app/assets/css/media.css`
  (`@custom-media --lg`, `--rail`, `--can-hover`…) et sont résolus au build.
- **Thèmes** : `data-theme="dark|light"` sur `<html>`, tous les tokens sont des
  custom properties. Un accent qui porte du texte utilise `--primary-text` /
  `--secondary-text`, contrastés pour le thème clair.
- **Mouvement** : n'animer que `transform`, `opacity`, `filter` et des custom
  properties. `prefers-reduced-motion` est respecté partout.
- **Aucun texte en dur** dans un composant : tout passe par les fichiers de locale.
- **Icônes** : uniquement via `<NcIcon name="…" />`, dont les noms sont générés
  par `npm run icons`. Ajouter une icône = éditer `scripts/build-sprite.mjs`
  (logo de marque) ou déposer un SVG dans `app/assets/icons/ui/`.
- **i18n** : les messages sont importés statiquement dans `i18n/i18n.config.ts`.
  Ne pas repasser à `langDir` : le serveur de développement répond alors 404 sur
  les fichiers de locale et chaque `t()` retombe silencieusement sur la clé brute,
  alors que le build de production reste vert.

## Déploiement

Vercel, connecté au dépôt. Build `nuxt build` (preset `vercel`), HTML prérendu servi
par le CDN. Les anciennes URL (`/about`, `/projects`…) sont redirigées en 301 vers
`/#<scène>` via les `routeRules`.

Variables d'environnement : voir `.env.example`.

## État d'avancement

| Lot | Contenu | État |
|---|---|---|
| L0 | Socle : projet, tokens, thèmes, i18n, CI | ✅ |
| L1 | Rail horizontal, navigation, mode vertical mobile | ✅ |
| L2 | Bibliothèque de primitives, sprite SVG | ✅ |
| L3 | Contenu des sept scènes | à faire |
| L4 | Parallax, particules, transitions | à faire |
| L5 | Formulaire de contact, scène Hollow Knight | à faire |
| L6 | Perf, SEO, finition, bascule DNS | à faire |
