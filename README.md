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
| `npm run assets:fetch` | rapatrie les pochettes Spotify / jaquettes IGDB en local |
| `npm run test:api` | exerce `POST /api/contact` sur le bundle construit |
| `npm run lighthouse` | audit Lighthouse sur la sortie de build |

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
  properties. `prefers-reduced-motion` est respecté partout — sauf les animations
  pilotées par le scroll, qui sont le mécanisme du rail et non de la décoration.
- **Effets plein écran** : les mesurer avant de les garder. `mix-blend-mode` et
  `skewY` appliqués à la surface du rail coûtaient chacun la moitié du budget de
  frame ; `npm run smoke` surveille désormais le temps de frame au défilement.
- **Aucun texte en dur** dans un composant : tout passe par les fichiers de locale.
- **Icônes** : uniquement via `<NcIcon name="…" />`, dont les noms sont générés
  par `npm run icons`. Ajouter une icône = éditer `scripts/build-sprite.mjs`
  (logo de marque) ou déposer un SVG dans `app/assets/icons/ui/`.
- **Images tierces** : les pochettes Spotify et les jaquettes IGDB pointent encore
  vers leurs CDN d'origine. Ces URL peuvent expirer ; `npm run assets:fetch` les
  rapatrie dans `public/img/remote/`, après quoi il faut faire pointer
  `app/data/about.ts` dessus. En attendant, une tuile dont l'image échoue affiche
  proprement son nom au lieu d'une image cassée.
- **i18n** : les messages sont importés statiquement dans `i18n/i18n.config.ts`.
  Ne pas repasser à `langDir` : le serveur de développement répond alors 404 sur
  les fichiers de locale et chaque `t()` retombe silencieusement sur la clé brute,
  alors que le build de production reste vert.

## Déploiement

Vercel, connecté au dépôt. Build `nuxt build` (preset `vercel`), HTML prérendu servi
par le CDN. Les anciennes URL (`/about`, `/projects`…) sont redirigées en 301 vers
`/#<scène>` via les `routeRules`.

Variables d'environnement : voir `.env.example`. **Sans les identifiants
EmailJS, le formulaire répond 503** et l'utilisateur voit le message d'erreur
qui rappelle l'adresse directe — c'est le comportement voulu, mais il faut
renseigner `NUXT_EMAILJS_*` dans Vercel pour que l'envoi fonctionne.

Le thème musical (`public/audio/`) pèse 4,4 Mo et est repris tel quel de v1. Il
se charge uniquement quand on le demande (`preload="none"`), mais un réencodage
autour de 1,5 Mo serait bienvenu.

## Avant la bascule DNS

1. Renseigner `NUXT_EMAILJS_*` dans les variables d'environnement Vercel, sinon
   le formulaire répond 503.
2. Lancer `npm run assets:fetch` puis faire pointer `app/data/about.ts` sur
   `/img/remote/` — les pochettes Spotify dépendent encore d'un CDN tiers.
3. Réencoder `public/audio/hollow-knight-theme.mp3` (4,4 Mo → ~1,5 Mo).
4. Valider la preview Vercel, puis basculer les DNS. Garder le VPS quelques
   jours en repli ; les redirections 301 doivent être en place avant.

## Mesures

Lighthouse desktop sur la sortie de build : **98 perf · 100 a11y · 96 best
practices · 100 SEO**. LCP 1,0 s, CLS 0,005, TBT 20 ms. Les 96 en best
practices tiennent aux pochettes Spotify injoignables depuis l'environnement de
build ; servies localement, le score atteint 100.

## État d'avancement

| Lot | Contenu | État |
|---|---|---|
| L0 | Socle : projet, tokens, thèmes, i18n, CI | ✅ |
| L1 | Rail horizontal, navigation, mode vertical mobile | ✅ |
| L2 | Bibliothèque de primitives, sprite SVG | ✅ |
| L3 | Contenu des sept scènes | ✅ |
| L4 | Parallax, particules, transitions | ✅ |
| L5 | Formulaire de contact, scène Hollow Knight | ✅ |
| L6 | Perf, SEO, finition | ✅ (bascule DNS à faire) |
