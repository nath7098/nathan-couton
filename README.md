# nathancouton.fr — v2

Portfolio de Nathan Couton, refonte en **Nuxt 4** du site
[nath7098/personal-website](https://gitlab.com/nath7098/personal-website) (Vue 3 + Vite).

**Compile → Run.** La page défile comme un fichier — hero, profil, parcours en
`git log --graph`, compétences, études de cas — puis, au seuil du contact,
`$ npm run contact` s'ouvre sur une scène épinglée où le Chevalier de Hollow
Knight traverse Greenpath et s'assoit sur un banc. Animations pilotées par le
scroll, particules canvas, polices auto-hébergées — aucune librairie de
composants UI.

> **La spécification fait foi : [`docs/SPEC.md`](docs/SPEC.md).**
> Son §14 (révision « Compile → Run ») prime sur les sections d'origine.
>
> **Vous reprenez le projet ? Lisez [`docs/HANDOFF.md`](docs/HANDOFF.md)** —
> état d'avancement, règle de vérification, et la liste des pièges de cette
> stack qui font perdre du temps.

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
| `npm run shots` | captures du parcours complet sur le build, à regarder |
| `npm run cv [dossier]` | régénère les CV PDF (fr, en) depuis les données du site ; aperçus PNG dans le dossier donné |
| `npm run test:api` | exerce `POST /api/contact` sur le bundle construit |
| `npm run lighthouse` | audit Lighthouse sur la sortie de build |

`npm run smoke` exige un `npm run build` préalable. En local, `CHROMIUM_PATH`
permet de pointer un binaire Chromium déjà présent.

## Architecture

```
app/
├── assets/css/     tokens, reset, typographie, breakpoints nommés
├── components/     primitives/ · layout/ · finale/ · scenes/ · effects/
├── composables/    useSections, useFinale, useMotionPreference, …
├── data/           sections, parcours, projets, compétences, now (TypeScript typé)
└── pages/index.vue page unique : cinq sections, puis le final
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
  properties. `prefers-reduced-motion` est respecté partout : le final se replie
  alors sur sa dernière image (Chevalier assis, formulaire prêt).
- **Effets plein écran** : les mesurer avant de les garder. `mix-blend-mode` et
  `skewY` appliqués à la surface du rail coûtaient chacun la moitié du budget de
  frame ; `npm run smoke` surveille désormais le temps de frame au défilement.
- **Aucun texte en dur** dans un composant : tout passe par les fichiers de locale.
- **Icônes** : uniquement via `<NcIcon name="…" />`, dont les noms sont générés
  par `npm run icons`. Ajouter une icône = éditer `scripts/build-sprite.mjs`
  (logo de marque) ou déposer un SVG dans `app/assets/icons/ui/`.
- **Aucune image tierce** : tout ce que la page affiche est servi par le site
  (CSP `img-src 'self'`). La « bande-son 2024 » est du texte daté.
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
2. Mettre à jour `public/cv/CV_Nathan_Couton.pdf` (il s'arrête à la Mutuelle de
   Poitiers).
3. Réencoder `public/audio/hollow-knight-theme.mp3` (4,4 Mo → ~1,5 Mo).
4. Valider la preview Vercel, puis basculer les DNS. Garder le VPS quelques
   jours en repli ; les redirections 301 doivent être en place avant.

## Mesures

Lighthouse desktop sur la sortie de build (rendu logiciel) : **93 perf · 100
a11y · 100 best practices · 100 SEO**. LCP 1,4 s, CLS 0, TBT 0 ms. JS critique
124 kB gzip, sections sous la ligne de flottaison hydratées à l'approche.

## État d'avancement

Voir [`docs/HANDOFF.md`](docs/HANDOFF.md) §1 : lots L0–L16 livrés, bascule DNS à faire.
