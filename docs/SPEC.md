# Spécification technique — Portfolio Nathan Couton v2 (Nuxt 4)

> **Destinataire** : développeur expert Nuxt 4 (Claude Code / Opus 5).
> **Source de vérité du contenu** : `https://gitlab.com/nath7098/personal-website` (Vue 3 + Vite, en production sur https://nathancouton.fr).
> **Statut** : **validée le 21/09/2026** — arbitrages arrêtés au §13, développement lancé au lot L0.
> **Langue du code** : anglais (identifiants, commentaires). **Langue du contenu** : FR + EN.

---

## 0. TL;DR

On refait le portfolio de zéro en **Nuxt 4**, en gardant **exactement les mêmes informations** et **la même découpe en 7 sections** que le site actuel, mais :

1. la navigation devient **mono-page à défilement horizontal** — on scrolle (molette / trackpad / doigt / clavier) et le contenu **file de gauche à droite** ;
2. on pousse les **effets visuels** très loin : parallax multi-couches, système de particules canvas, transitions CSS ciselées, animations pilotées par le scroll ;
3. **zéro framework UI générique** (pas de Bootstrap, Vuetify, PrimeVue, Angular Material, Tailwind UI, shadcn…). Chaque composant est écrit à la main, en reprenant l'ADN visuel des composants actuels mais retravaillé jusqu'à la perfection ;
4. le site reste **responsive**, **accessible**, **performant** et **SEO-friendly** malgré le parti-pris horizontal ;
5. tout est **prérendu et déployé sur Vercel**, sans donnée récupérée à l'exécution (§13).

---

## 1. Analyse de l'existant

### 1.1 Stack actuelle

| Domaine | Choix actuel |
|---|---|
| Framework | Vue 3.4 (`<script setup>`, Composition API), SPA pure |
| Build | Vite 5 |
| Routing | vue-router 4, 7 routes, transition `slide-left` / `slide-right` selon l'index de la route |
| État | Pinia (store `app` : `darkMode`, `locale`, `spotifyData`, `gamesData`, `hobbiesData`, `hasProcessLoading`) |
| i18n | vue-i18n 9, `legacy: false`, locales `fr` (défaut) / `en`, persistance `localStorage` |
| Styles | SCSS, variables globales injectées via `additionalData`, thèmes dark/light via `spread-map` → custom properties sur `:root.dark` / `:root.light` |
| Icônes | FontAwesome (solid/regular/brands) + `devicon` (CSS classes) |
| Modales | `vue-final-modal` |
| Toasts | `vue3-toastify` |
| Loaders | `vue3-spinner` (`BounceLoader`, `FadeLoader`) |
| Formulaire | `@emailjs/browser` (service `service_personal`, template `template_personal`, clé publique `z4ONDSAdpiceLSY_Y`) |
| Données dynamiques | API Express maison (`https://api.nathancouton.fr`) : `/spotify`, `/games`, `/hobbies`, avec fallbacks JSON locaux |
| Deploy | Docker multi-stage → nginx alpine → VPS, reverse-proxy nginx, CI GitLab + semantic-release (**remplacé par Vercel**, §12.3) |

### 1.2 Cartographie des pages

| # | Route | Vue | Contenu |
|---|---|---|---|
| 1 | `/` | `HomeView` | Hero : salutation, `Nathan Couton` en `<h1>` encadré de `{{ }}`, titre « Développeur Fullstack », CTA `@click.prevent="..."` stylé comme du code |
| 2 | `/about` | `AboutView` | Bento grid 4×4 : photo ronde, carte météo Tours/37, logo employeur, top Spotify (4 artistes + 4 titres), jeux, hobbies |
| 3 | `/experience` | `ExperienceView` | Timeline verticale alternée, 3 expériences, items dépliables → sous-missions + tags technos cliquables (modale de détail) |
| 4 | `/skills` | `SkillsView` | 4 roues de compétences (Front / Back / Database / Tools), icônes disposées en cercle, rotation vers l'icône sélectionnée, panneau détail (ancienneté + barre de niveau /5) |
| 5 | `/education` | `EducationView` | Même timeline, 3 formations, sans détails dépliables |
| 6 | `/projects` | `ProjectsView` | Grille de 4 projets principaux + toggle « autres projets » révélant 4 projets secondaires |
| 7 | `/contact` | `ContactView` | Scène parallax Hollow Knight (8 calques) + icônes de contact + formulaire e-mail |
| — | `/blog` | `BlogView` | Stub non routé (`<div>Blog view</div>`) — **hors périmètre** |

### 1.3 Ce qu'on garde, ce qu'on jette

**On garde (contenu identique) :**
- Les 7 sections et leur ordre.
- 100 % des textes FR/EN (`src/assets/i18n/fr.js`, `en.js`) — repris **tels quels**, y compris les fautes de frappe éventuelles ne seront corrigées que sur demande explicite.
- Les 3 expériences, 3 formations, 8 projets, 4 familles de compétences avec leurs niveaux et anciennetés.
- Les coordonnées : `contact@nathancouton.fr`, `0646898223`, LinkedIn `nathan-couton`, GitHub `nath7098`, GitLab `nath7098`.
- Le CV PDF téléchargeable.
- La scène parallax Hollow Knight et son easter egg (clic sur le Chevalier → apparition + thème musical).
- Le double thème dark/light et le bascule FR/EN.
- Les contenus Spotify / jeux / hobbies **tels qu'affichés aujourd'hui** — mais figés en dur, l'API maison disparaissant (§13.1).

**On jette :**
- Toutes les dépendances UI tierces : `vue-final-modal`, `vue3-toastify`, `vue3-spinner`, `vue3-clipboard`, `devicon` (CSS), `@fortawesome/*`. Remplacées par des composants et icônes maison.
- Le routing multi-pages (remplacé par le rail horizontal, cf. §3).
- Les bugs/résidus repérés : `opacity: 7` (`AboutView`), `border-radius: 90px - 6` (SCSS invalide), `root: /urs/share/nginx/html` (typo nginx), `.glow` sans usage réel, pseudo-élément `TEST` sur `.knight:hover + .bench::before`, `key="gameLoading"` dupliqué sur 3 loaders, store Pinia qui déclare `infos/education/experience/project/skills` sans jamais les retourner, `console.log` de debug.
- Les `window.addEventListener('scroll')` non nettoyés et les écritures `style.marginTop` directes (remplacées par des custom properties et du compositing GPU).

---

## 2. Stack cible

```jsonc
// package.json — dépendances retenues
{
  "dependencies": {
    "nuxt": "^4",                    // Nuxt 4, app/ directory
    "vue": "^3.5"
  },
  "devDependencies": {
    "@nuxt/image": "latest",         // IPX/optimisation, AVIF/WebP, srcset
    "@nuxt/fonts": "latest",         // self-host JetBrains Mono / Roboto Mono
    "@nuxtjs/i18n": "^10",           // FR/EN, stratégie prefix_except_default
    "@nuxtjs/color-mode": "latest",  // dark/light + prefers-color-scheme + persistance
    "@vueuse/nuxt": "latest",        // useRafFn, useElementSize, useEventListener, useIdle…
    "@nuxt/eslint": "latest",
    "typescript": "^5",
    "vitest": "latest",
    "@nuxt/test-utils": "latest",
    "@playwright/test": "latest"
  }
}
```

**Interdits explicites** : toute librairie de composants UI (Bootstrap, Vuetify, PrimeVue, Naive, Element, shadcn-vue, Nuxt UI), toute librairie d'icônes packagée en composants génériques, Tailwind. Les seules libs d'animation tolérées sont celles qui n'imposent aucun style : aucune n'est requise — **tout se fait en CSS + un composable rAF maison** (cf. §5). Si une exception devient nécessaire, la justifier en PR avant de l'ajouter.

**Rendu** : `ssr: true` + **prérendu intégral** (`nitro.preset: 'vercel'`, `nitro.prerender.routes: ['/', '/en']`, `crawlLinks: false`). Le HTML des deux locales est généré au build et servi depuis le CDN Vercel — aucun rendu à l'exécution.

Une **seule fonction serverless** subsiste : `POST /api/contact` (§6.7). Le preset `vercel` de Nitro la déploie automatiquement à côté des fichiers statiques, sans configuration ni serveur à administrer. Elle existe pour ne pas exposer les identifiants d'envoi d'e-mail dans le bundle et pour porter le rate-limit. Repli possible si l'on veut *zéro* fonction : EmailJS appelé directement depuis le client avec sa clé publique (c'est son usage prévu), au prix du rate-limit et de la protection anti-spam côté serveur.

**Plus aucune donnée n'est récupérée à l'exécution** : Spotify, jeux et hobbies sont figés en dur (§9.3).

---

## 3. Le rail horizontal — cœur du projet

### 3.1 Principe

Le document conserve une **hauteur verticale réelle** (le navigateur scrolle normalement), mais le contenu est un **rail horizontal** translaté en X proportionnellement au scroll vertical. On garde ainsi : inertie native, trackpad, barre de défilement, `Page Down`, `Home`/`End`, recherche dans la page, et l'accessibilité clavier.

```
┌─ #scroll-proxy  (height: calc(var(--scene-count) * 100svh))   ← hauteur fictive
│  ┌─ .rail-sticky  (position: sticky; top: 0; height: 100svh; overflow: clip)
│  │  ┌─ .rail-track  (display: flex; height: 100%; will-change: transform)
│  │  │   [scene 1][scene 2][scene 3][scene 4][scene 5][scene 6][scene 7]
│  │  └─ translate3d(calc(-1 * var(--rail-progress) * (100% - 100vw)), 0, 0)
└──┴──┘
```

- `--scene-count` = 7. La hauteur du proxy est paramétrable **par scène** : une scène dense (About, Projects) mérite plus de « course de scroll » qu'un hero. On expose donc `--scroll-span` par scène (en multiples de viewport, défaut `1`), et la hauteur totale = somme des spans.
- Chaque scène fait `width: 100vw` par défaut ; les scènes larges (Projects, Experience) peuvent faire `width: max-content` / `200vw` — le calcul de translation doit alors se baser sur la **largeur réelle du track** (`scrollWidth - innerWidth`), pas sur un multiple de `100vw`.

### 3.2 Deux implémentations, une détection

**Chemin A — CSS scroll-driven animations (privilégié) :**

```css
@supports (animation-timeline: scroll()) {
  .rail-track {
    animation: rail-slide linear both;
    animation-timeline: scroll(root block);
  }
  @keyframes rail-slide {
    to { transform: translate3d(calc(-1 * (var(--rail-width) - 100vw)), 0, 0); }
  }
}
```
Zéro JS dans la boucle de scroll, tout sur le compositor.

**Chemin B — fallback rAF (Safari ancien, Firefox sans le flag) :**
composable `useRailScroll()` : `scroll` passif → lecture de `scrollY` → **lerp** (damping ~0.1, epsilon 0.05) → écriture d'une seule custom property `--rail-progress` sur le track dans une `requestAnimationFrame`. **Aucune lecture de layout dans la boucle** (dimensions mises en cache, recalculées sur `ResizeObserver` + `orientationchange`, debouncées à 150 ms).

La détection se fait une fois : `CSS.supports('animation-timeline: scroll()')`. Le fallback ne doit **jamais** être chargé si le chemin A est actif (import dynamique).

### 3.3 Progression et signaux dérivés

Le composable `useRail()` (fourni via `provide/inject`, pas de store global) expose, en lecture seule :

| Signal | Type | Description |
|---|---|---|
| `progress` | `Ref<number>` | 0 → 1 sur l'ensemble du rail |
| `activeScene` | `Ref<SceneId>` | scène dont le centre est le plus proche du centre du viewport |
| `sceneProgress(id)` | `(id) => number` | 0 → 1 sur la scène demandée (−1 avant, 2 après, clampé côté usage) |
| `velocity` | `Ref<number>` | px/frame lissée, signée — alimente les effets de skew/chromatic aberration |
| `direction` | `Ref<1 \| -1>` | sens du défilement |
| `goTo(id, opts?)` | `(id) => void` | navigation programmatique (`scrollTo` sur le proxy, `behavior: 'smooth'` sauf reduced-motion) |
| `isSnapping` | `Ref<boolean>` | vrai pendant une navigation programmatique (pour geler certains effets) |

Ces signaux sont aussi miroir**és en CSS** sur `.rail-track` : `--rail-progress`, `--rail-velocity`, `--scene-progress` (par scène, via `view-timeline` quand dispo). Règle d'or : **les composants lisent le CSS, pas le JS**, sauf quand un calcul est impossible en CSS.

### 3.4 Snap

> **État L1 :** non implémenté, volontairement. Le rail est confortable en défilement libre et un snap mal réglé se combat avec l'utilisateur. À reprendre au L4, une fois les scènes remplies : c'est à ce moment qu'on saura si le besoin existe vraiment.


Scroll libre par défaut, mais **snap doux** : après 120 ms d'inactivité de scroll, si la scène active est à moins de 35 % de décalage, on s'aligne dessus (`scrollTo` smooth). Désactivé si `prefers-reduced-motion: reduce`, si l'utilisateur est en train de saisir dans un champ, et sur la scène Contact (formulaire → l'utilisateur doit pouvoir s'arrêter où il veut).

### 3.5 Navigation, URL et deep-linking

- **Pas de `vue-router` multi-pages.** Une seule page (`app/pages/index.vue`), mais :
- chaque scène a un `id` (`home`, `about`, `experience`, `skills`, `education`, `projects`, `contact`) ;
- l'URL reflète la scène active via **`history.replaceState` sur le hash** (`/#about`), débouncé à 200 ms, sans déclencher de navigation Vue ;
- à l'arrivée, si `location.hash` correspond à une scène, on saute directement à sa position (sans animation) **avant la première peinture** — via un petit script inline dans `app.vue`/`head` pour éviter le flash ;
- les anciennes URL (`/about`, `/experience`, …) sont **redirigées 301 vers `/#<scene>`** via les `routeRules` de Nuxt, que le preset `vercel` traduit en redirections natives de la plateforme (aucune fonction n'est réveillée) :

```ts
// nuxt.config.ts
routeRules: {
  '/about':      { redirect: { to: '/#about',      statusCode: 301 } },
  '/experience': { redirect: { to: '/#experience', statusCode: 301 } },
  // … skills, education, projects, contact, et leurs équivalents /en/*
}
```

Attention : un fragment n'est pas transmis au serveur, donc la redirection ne peut pas *lire* le hash — elle ne fait que l'imposer. C'est le comportement voulu.

### 3.6 Entrées clavier / pointeur

| Entrée | Comportement |
|---|---|
| Molette verticale | scroll natif → rail |
| Molette / trackpad **horizontal** (`deltaX`) | mappé sur le scroll vertical (`scrollBy`), pour que le geste horizontal « marche » aussi |
| `Tab` | focus natif ; un `scroll-margin` + `scrollIntoView` implicite doit amener la scène du champ focalisé à l'écran. **Bug classique à éviter** : dans un conteneur `overflow: clip`, le focus décale le conteneur — utiliser `overflow: clip` (pas `hidden`) et intercepter `focusin` pour re-synchroniser le rail sur le proxy |
| `←` / `→` | scène précédente / suivante |
| `Home` / `End` | première / dernière scène |
| `Space` / `Shift+Space`, `PageUp/Down` | natif |
| Touch | scroll vertical natif → rail. Voir §8 pour le layout mobile |

### 3.7 Barre de progression + navigation

Composant `NcRailNav` : rail fin en bas (desktop) ou en haut (tablette), avec :
- une piste pleine largeur, remplie proportionnellement à `--rail-progress` (transform scaleX, pas de width) ;
- 7 pastilles positionnées au prorata du span de chaque scène, cliquables (`goTo`) ;
- le label de la scène active en typographie monospace, avec transition de type « machine à écrire » (largeur + `steps()`) reprise du logo d'intro actuel ;
- `role="navigation"`, `aria-label`, chaque pastille = `<button>` avec `aria-current="true"` sur la scène active.

---

## 4. Design system

### 4.1 Tokens

Le système actuel (SCSS map → custom properties) est conservé dans son **intention** mais réécrit en **CSS natif** : un unique `app/assets/css/tokens.css` définissant tous les tokens sur `:root`, surchargés sous `[data-theme="dark"]` / `[data-theme="light"]`.

**Plus de SCSS dans le projet.** Le nesting est natif, les media-queries nommées passent par `postcss-custom-media` (`@custom-media --lg (width >= 1024px)`), et les mélanges de couleurs par `color-mix()`. Le préprocesseur ne servait qu'à générer des custom properties : il n'a plus de raison d'être.

```css
:root {
  /* ─ Palette brute (inchangée) ─ */
  --c-white: #f5f5f5;   --c-black: #212529;
  --c-orange: #f05f40;  --c-green: #42b883;  --c-blue: #007acc;
  --c-yellow: #c99513;  --c-red: #c3002f;    --c-purple: #563d7c;
  --c-polytech: #009fe3; --c-acii: #2d9ad5;  --c-iut-red: #bf1e2e;

  /* ─ Rythme ─ */
  --space-3xs: .25rem; --space-2xs: .5rem; --space-xs: .75rem;
  --space-s: 1rem; --space-m: 1.5rem; --space-l: 2.5rem;
  --space-xl: 4rem; --space-2xl: 6rem; --space-3xl: 10rem;

  /* ─ Typo fluide (clamp, pas de media-query) ─ */
  --font-mono: "JetBrains Mono", "Roboto Mono", ui-monospace, monospace;
  --step--1: clamp(.78rem, .74rem + .2vw, .89rem);
  --step-0:  clamp(1rem, .95rem + .25vw, 1.15rem);
  --step-1:  clamp(1.3rem, 1.2rem + .5vw, 1.6rem);
  --step-2:  clamp(1.7rem, 1.5rem + 1vw, 2.4rem);
  --step-3:  clamp(2.2rem, 1.8rem + 2vw, 3.6rem);
  --step-4:  clamp(2.8rem, 2rem + 4vw, 5.5rem);

  /* ─ Mouvement ─ */
  --ease-out-expo: cubic-bezier(.16, 1, .3, 1);
  --ease-in-out-quint: cubic-bezier(.83, 0, .17, 1);
  --ease-spring: linear(0, .32 6%, .78 15%, 1.05 23%, 1.12 28%, 1.04 38%, .99 50%, 1);
  --dur-fast: 140ms; --dur-base: 280ms; --dur-slow: 520ms; --dur-scene: 900ms;

  /* ─ Élévation (ombres portées douces, pas de box-shadow dur) ─ */
  --shadow-1: 0 1px 2px color-mix(in oklab, var(--shadow-tint) 18%, transparent),
              0 2px 8px color-mix(in oklab, var(--shadow-tint) 12%, transparent);
  --shadow-3: 0 8px 24px color-mix(in oklab, var(--shadow-tint) 24%, transparent),
              0 24px 64px color-mix(in oklab, var(--shadow-tint) 18%, transparent);
  --radius-s: 6px; --radius-m: 12px; --radius-l: 20px; --radius-pill: 999px;
}

[data-theme="dark"] {
  --primary: var(--c-orange);  --secondary: var(--c-green);
  --tertiary: var(--c-blue);   --danger: var(--c-red);
  --surface: var(--c-white);   --background: var(--c-black);
  --surface-dim: color-mix(in oklab, var(--surface) 70%, var(--background));
  --editor: #000;              --shadow-tint: #000;
  --glass: color-mix(in oklab, var(--background) 62%, transparent);
}
[data-theme="light"] {
  --primary: var(--c-green);   --secondary: var(--c-orange);
  --tertiary: var(--c-yellow); --danger: var(--c-purple);
  --surface: var(--c-black);   --background: var(--c-white);
  --surface-dim: color-mix(in oklab, var(--surface) 70%, var(--background));
  --editor: #fff;              --shadow-tint: #35405a;
  --glass: color-mix(in oklab, var(--background) 62%, transparent);
}
```

> **Note d'inversion** : dans le thème clair actuel, `--primary` et `--secondary` s'échangent (vert ↔ orange). On conserve ce comportement : il donne au light mode une identité propre.

### 4.2 Palette des technologies

Les 28 paires `--<tech>-border` / `--<tech>-background` du fichier `global.scss` actuel sont reprises **à l'identique** (vue, vuex, pinia, vite, react, jquery, p5, bootstrap, angular, java, js, ts, unity, csharp, cpp, agile, firebase, html, css, flex, spring, express). Elles sont générées dans `tokens.css` sous forme de paires, et consommées par `NcTag` via `--tag-accent` / `--tag-bg`. Ajouter les manquantes utilisées par le contenu : `android`, `nuxt`, `sass`, `node`, `docker`, `oracle`, `postgres`, `mysql`, `mongo`, `dotnet`, `intellij`, `vscode`, `gitlab`, `github`, `illustrator`.

### 4.3 Typographie

- Police unique **monospace**, comme aujourd'hui. Passage de Roboto Mono à **JetBrains Mono** (ligatures de code, meilleures graisses) — self-hostée via `@nuxt/fonts`, `font-display: swap`, subset latin + latin-ext, preload de la graisse 400 et 700 uniquement.
- Le motif `{{ … }}` autour des `h1` et les pseudo-éléments `@click.prevent="…"` du CTA sont **conservés** : c'est la signature du site. Ils sont repris en composants (`NcHeading`, `NcCodeButton`) avec animation d'entrée (les accolades arrivent de l'extérieur et se referment sur le texte).

### 4.4 Grille & layout d'une scène

Chaque scène est un `<section class="scene">` de `100svh` de haut, `100vw` de large (sauf exception), avec une grille interne partagée :

```css
.scene {
  display: grid;
  grid-template-columns:
    [full-start] var(--gutter)
    [content-start] minmax(0, 1fr) [content-end]
    var(--gutter) [full-end];
  align-content: center;
  --gutter: clamp(1rem, 6vw, 8rem);
}
```

Toutes les scènes partagent : un **numéro de scène** discret (`01` … `07`) en haut à gauche, un **titre** et un fond propre. Cohérence = le lecteur sait toujours où il est.

---

## 5. Effets visuels

### 5.1 Règles transverses (non négociables)

1. **N'animer que `transform`, `opacity`, `filter` et les custom properties.** Jamais `width`, `height`, `top`, `margin` dans une boucle de scroll (le site actuel écrit `style.marginTop` sur 15 éléments par frame — c'est précisément ce qu'on corrige).
2. **Un seul `requestAnimationFrame` global.** Pas de rAF par composant. Un orchestrateur (`useFrameLoop`) distribue le tick ; il se met en pause quand l'onglet est caché (`document.visibilitychange`) et quand le rail est immobile depuis 400 ms.
3. **`will-change` est ciblé et temporaire** : posé sur les calques parallax et le track, retiré quand l'élément est hors-champ (éviter l'explosion mémoire GPU).
4. **Budget de composition** : maximum ~12 calques promus simultanément. Les scènes non visibles reçoivent `content-visibility: auto` + `contain: layout paint style`.
5. **`prefers-reduced-motion: reduce`** : parallax figé à sa position médiane, particules réduites à un fond statique (une frame peinte, rien qui bouge), transitions ramenées à ≤ 80 ms en `opacity` seule, snap désactivé, musique jamais auto-jouée. **Un seul point de vérité** : le composable `useMotionPreference()`, et un attribut `[data-motion="reduced"]` sur `<html>` pour le CSS.

   > **Exception impérative (L4) :** les animations **pilotées par le scroll** (`rail-slide`, `scene-sweep`) sont exclues de la règle globale qui écrase `animation-duration`. Ce ne sont pas des décorations : elles *sont* le rail, et leur progression est le défilement de l'utilisateur. Les ramener à `0.01ms` projetait le track à sa position finale et figeait chaque scène à `--scene-progress: 1` — le site cessait de fonctionner en reduced-motion. Réduire le mouvement veut dire supprimer ce que l'utilisateur n'a pas demandé, pas le défilement qu'il est en train de faire.
6. **Toute animation d'entrée est idempotente et réversible** : on scrolle dans les deux sens ; rien ne doit « rester coincé » en état intermédiaire.

### 5.2 Parallax

Trois familles :

**(a) Parallax de rail (toutes les scènes).** Chaque scène déclare des calques avec une profondeur `--depth` ∈ [−1, 1]. Le calque est translaté horizontalement à `calc(var(--rail-progress-local) * var(--depth) * var(--parallax-amplitude))`. Profondeur négative = va à contre-sens (arrière-plan), positive = devance (premier plan). Amplitude par défaut `12vw`.

**(b) Parallax de pointeur — ~~prévu~~ retiré.** La spec demandait un décalage des calques de ±1.5 % suivant la souris. C'est **supprimé**, et ça ne reviendra pas :

- **Ça casse l'illusion.** Une parallaxe est un mouvement de caméra, et un mouvement de caméra appartient au déplacement. Dès que le décor réagit à la souris, il réagit à quelque chose que le personnage ne fait pas, et le relief cesse de se lire comme de la profondeur.
- **Ça coûtait cher.** `providePointer()` tournait en boucle `requestAnimationFrame` en permanence sur desktop — même souris immobile — et écrivait deux propriétés personnalisées sur `<html>` à chaque frame. Sur une page dont toute la mise en page est pilotée par des propriétés personnalisées héritées de `<html>`, c'est un recalcul de style de tout le document par frame, en concurrence directe avec les animations de scroll du compositeur.

Le composable, le composant `NcParallaxLayer` qui le consommait et les tokens `--pointer-x` / `--pointer-y` ont été supprimés.

**(c) Parallax de scène Contact (le gros morceau).** Réécrite. Le modèle de calques ci-dessous (profondeurs `−0.05` → `0.55`, `scale()` par calque, caméra qui annule le déplacement du rail) a été remplacé — voir l'en-tête de `app/data/parallax.ts` pour le détail et `docs/PASSATION.md` §4 pour le pourquoi. En résumé :

- La scène fait **une seule fenêtre de large** et se fige plein écran ; le budget de scroll de la marche (`WALK_SPAN`, `app/utils/rail-geometry.ts`) vient *après* la course du rail, au lieu d'être pris dessus. Plus rien n'annule rien.
- Chaque calque porte une **profondeur** = vitesse apparente à l'écran, le sol valant 1 : `0.10` pour le fond, `1.90` pour la lèvre de roche de premier plan. C'est le modèle du jeu — des plans plats, déplacés d'une fraction du déplacement de la caméra.
- Les distances sont des **keyframes de `transform`** rangées sur la timeline de scroll, une par élément. Aucune propriété personnalisée n'est animée : c'est ce qui faisait trembler la scène.

**Décor : la grotte (remplace Greenpath).** Les treize planches Greenpath ont été remplacées par **huit calques découpés dans une seule peinture**, `public/img/parallax/cave-source.webp`, par `scripts/build-cave-layers.mjs` (`npm run cave`). Le raisonnement complet est dans l'en-tête du script ; les points qui engagent le reste du site :

- La planche est un **panorama 1672 × 384** (4,35∶1) là où Greenpath était en 1366 × 768. `--art` reste `max(100vw / L, 100svh / H)`, mais sur tout écran plus étroit que 4,35∶1 — c'est-à-dire tous — c'est le terme de hauteur qui gagne, et la peinture fait deux à trois écrans de large. La plupart des calques n'ont donc pas besoin d'être répétés.
- **Conséquence : la course se mesure en largeurs de fenêtre, plus en largeurs de planche.** Les planches Greenpath avaient la forme d'une fenêtre, donc une fraction de planche valait une fraction d'écran partout. Celle-ci est épinglée par sa hauteur : une largeur de planche vaut deux écrans sur un moniteur et treize sur un téléphone tenu debout. La course du Chevalier était déjà en `vw` ; le monde qu'il traverse l'est maintenant aussi.
- Le nombre de copies d'un calque dépend donc de la **forme de l'écran** : `tileCount()` écrit la garantie contre le 32∶9, le panneau le plus large vendu, et tout ce qui est plus étroit gare simplement la copie en trop hors champ.
- Les 284 lignes de la peinture sont **complétées à 384** par 50 lignes de son propre bord, fondues vers le noir, en haut et en bas. Sans elles la scène agrandit la peinture ×3,2 pour couvrir la hauteur de la fenêtre et n'en montre qu'un tiers ; avec, ×2,3 et la moitié d'une planche de plus en cadre. Le padding est symétrique, donc `GROUND_LINE` ne bouge pas. **Mesuré : 133 Ko en AVIF** pour les 8 calques, contre 278 Ko pour les 13 de Greenpath et un budget de 900 Ko.

> **Écart (L5) :** les calques `Knight_sit` et `sit_fr/en` sont servis en WebP simple et non via `<picture>`, et le MP3 du thème est **repris tel quel (4,4 Mo)** — aucun outil audio n'était disponible dans l'environnement de portage. Il est chargé en `preload="none"`, donc il ne pèse sur aucun chargement de page, mais un réencodage autour de 1,5 Mo reste souhaitable avant la mise en production.

> **Note de mesure (L3) :** Nuxt **inline les styles** de la page prérendue (34 Ko bruts, 9,6 Ko gzip répartis en balises `<style>`), il n'y a donc pas de `<link>` CSS pour les scènes et aucun flash au chargement. Le script de budget compte désormais ce CSS inline — sa première version ne regardait que les fichiers liés et sous-estimait le CSS d'un facteur dix.

### 5.3 Système de particules

Composant `NcParticleField` — **canvas 2D maison**, aucune dépendance.

- **Rendu** : un seul `<canvas>` par scène qui en demande, dimensionné en `devicePixelRatio` capé à 2, redimensionné via `ResizeObserver` debouncé.
- **Modèle** : pool pré-alloué de particules stockées dans des `Float32Array` parallèles (x, y, vx, vy, life, size, seed) — pas d'objets JS, pas d'allocation en boucle, GC à plat.
- **Presets** (l'API expose `preset`, `density`, `palette`, `speed`, `interactive`) :

| Preset | Scène | Aspect |
|---|---|---|
| `code-rain` | Home | glyphes monospace qui tombent lentement, opacité liée à la profondeur, teinte `--secondary` |
| `dust` | About, Education | poussières flottantes, mouvement brownien doux, parallaxées par `--pointer-*` |
| `constellation` | Skills | points reliés par des segments quand la distance < 120 px, l'épaisseur du lien suit l'opacité |
| `embers` | Experience | braises montantes, dérive latérale sinusoïdale |
| `grid-pulse` | Projects | grille de points, onde radiale émise au survol d'une carte |
| `spores` | Contact | lucioles/spores façon Hollow Knight, lueur additive (`globalCompositeOperation: 'lighter'`), attirées mollement par le curseur |

- **Densité adaptative** : `density = base * clamp(viewportArea / 1_500_000, 0.4, 1.4)`, divisée par 2 si `navigator.hardwareConcurrency <= 4`, par 2 encore si la moyenne glissante du temps de frame dépasse 20 ms pendant 30 frames (dégradation automatique, jamais de remontée brutale).
- **Cycle de vie** : le champ ne tourne **que** si sa scène est visible (`IntersectionObserver`, seuil 0.01) et si l'onglet est actif. Sinon `cancelAnimationFrame` + canvas vidé.
- **Reduced motion** : particules figées à une position aléatoire stable (rendu une seule fois) ou champ non monté selon le preset.
- **Accessibilité** : `<canvas aria-hidden="true">`, jamais focusable, jamais porteur d'information.
- **Interdiction** : pas de `tsparticles`, pas de `three.js`. Si un effet exige vraiment du WebGL, le proposer avant de l'implémenter.

### 5.4 Transitions & micro-interactions

Catalogue à implémenter (tout en CSS, déclenché par `view-timeline` ou par une classe `.is-in-view` posée par `IntersectionObserver`) :

- **Entrée de scène** : les blocs arrivent en `translate3d(0, 24px, 0) scale(.98)` + `opacity: 0` → état neutre, en cascade (`--stagger: calc(var(--i) * 60ms)`), courbe `--ease-out-expo`.
- ~~**Skew cinétique**~~ — **retiré après mesure (L4).** Le principe : faire pencher le track dans le sens du scroll. Mesuré de trois façons (sur chaque scène, sur un wrapper unique, à amplitude réduite), il coûtait à chaque fois **la moitié du budget de frame** : médiane 33 ms → 67 ms. La surface à déformer fait 1150 vw quelle que soit la découpe, et regrouper les sept scènes sous un seul calque a empiré les choses plutôt que l'inverse. Un penchement de ±2,5° ne vaut pas de diviser la fluidité par deux. `--rail-velocity` reste publié pour des effets portant sur de petits éléments.
- **Révélation par masque** : titres révélés par `clip-path: inset()` animée, pas par `opacity` seule.
- **Texte « machine à écrire »** : conservé pour l'intro et le label de nav — `steps()` + curseur clignotant, comme aujourd'hui, mais avec `ch` et sans `width: 0` figé.
- **Hover de carte** : élévation (`--shadow-1` → `--shadow-3`), `translateZ` simulé par `scale(1.015)`, lueur de bordure via `background: linear-gradient` sur un pseudo-élément masqué, et **spotlight suivant le curseur** (`--mx` / `--my` posés au `pointermove`, throttlés à la frame).
- **Curseur personnalisé** (desktop, pointeur fin uniquement) : un disque lerp-é qui grossit sur les éléments interactifs et affiche un libellé contextuel (`Voir`, `Ouvrir`, `Jouer`). Désactivé si `(pointer: coarse)` ou reduced-motion. **Le curseur natif reste visible** sur les champs de formulaire et le texte sélectionnable — pas de `cursor: none` global.
- **Transition de thème** : `document.startViewTransition()` quand disponible, avec un balayage circulaire partant du bouton ; fallback = cross-fade de 280 ms. Les tokens étant des custom properties, tout bascule d'un coup, sans flash.
- **Transition de langue** : les textes qui changent sortent en `blur(6px) + translateY(-6px)` et rentrent inversés, décalés de 40 ms par bloc.

### 5.5 Bruit & grain

Un overlay `background-image` SVG `feTurbulence` (généré une fois, inliné en data-URI, ~1,2 Ko), `pointer-events: none`, animé par `steps()` sur 8 positions (pas de re-génération par frame). Il unifie toute la page et casse le banding des dégradés.

> **Deux corrections mesurées (L4) :** `mix-blend-mode: overlay` sur toute la surface **doublait le temps de frame** à lui seul (médiane 16,7 → 33,3 ms, p95 33 → 83 ms). Il est retiré ; le grain garde sa texture en alpha simple, à `opacity: .05` pour compenser. Par ailleurs l'`inset: -50%` initial quadruplait la surface composée alors que le grain ne se déplace que de ±2 % — ramené à `-4%`.

---

## 6. Spécification scène par scène

> Chaque scène = `app/components/scenes/Nc<Nom>Scene.vue`. Toutes reçoivent `:index` et lisent `useRail()`.

### 6.1 Scène 01 — Home (`#home`, span 1)

**Contenu (identique) :**
- `home.greetings` : « Hello! Je m'appelle » / « Hi! I'm »
- `Nathan Couton` en `h1`, encadré de `{{` `}}` colorés en `--secondary`
- `home.position` : « Développeur Fullstack » / « Fullstack Developer »
- CTA `home.button` : « En savoir plus » / « Get to know me better », rendu comme `@click.prevent="En savoir plus"`

**Traitement :**
- Séquence d'intro **rejouée du site actuel mais assumée** : le logo `<Nathan Couton />` se tape en machine à écrire (1,75 s), puis le voile se rétracte vers le coin (animation `shrink`). Nouveauté : l'intro ne joue **qu'une fois par session** (`sessionStorage`), et est **sautable** (clic / touche / scroll). Durée max 2,2 s, jamais bloquante pour le LCP — le contenu est dans le DOM et lisible dès le départ, le voile est un calque au-dessus.
- Le `h1` se compose lettre par lettre en `clip-path`, les accolades convergent depuis les bords.
- Fond : preset de particules `code-rain` + une grille en perspective légère qui dérive avec `--pointer-*`.
- Le CTA `goTo('about')`, avec un chevron qui pointe **vers la droite** (le sens du site) et une animation de rebond horizontal.
- Indice de défilement : « scroll → » avec une flèche animée, disparaissant dès `progress > 0.02`.

### 6.2 Scène 02 — About (`#about`, span 1.5)

**Contenu (identique) :** photo de profil, carte météo (Tours, 37, `about.description`, `about.pickupline`), logo employeur, top Spotify (4 artistes + 4 titres, blacklists incluses), jeux, hobbies.

**Données : entièrement statiques.** Le compte Spotify n'existe plus et l'API maison est abandonnée — les trois listes sont figées dans `app/data/about.ts` à partir du dernier état connu (backup du dépôt source, filtres déjà appliqués : artistes exclus `["Lorenzo"]`, titres exclus `["Zorro est arrivé"]`, album exclu `["Aqua Regia"]`, `slice(0, 4)`). Valeurs retenues en annexe A.6.

Conséquences : plus d'`onMounted` asynchrone, plus d'états de chargement, plus de gestion d'erreur, plus de CORS — les tuiles sont rendues en SSG avec le reste de la page. Les liens « ouvrir dans Spotify » restent actifs (`https://open.spotify.com/...`, plus pertinent que l'URI `spotify:` qui exige l'application installée).

**Pochettes et photos d'artistes** : les URLs `i.scdn.co` du backup sont des ressources tierces susceptibles d'expirer. Elles sont donc **rapatriées une fois pour toutes** dans `public/img/spotify/` (8 fichiers, convertis en AVIF/WebP) par le script `scripts/fetch-remote-assets.ts`, à lancer en local au lot L3 — ce téléchargement n'est pas possible depuis l'environnement d'agent (domaine bloqué). Si une image s'avère morte, prendre une capture équivalente ou retirer l'entrée.

**Traitement :**
- **Bento grid** repensée : plus de `grid-template-rows: repeat(4, 8rem)` rigide en `rem`, mais une grille fluide 12 colonnes × 8 rangées avec `aspect-ratio` sur les tuiles. La composition reste la même (photo ronde en haut-gauche, météo large, logo, gros bloc Spotify, jeux, hobbies).
- Chaque tuile entre en **cascade horizontale** : elles arrivent décalées en X selon leur colonne, à des vitesses légèrement différentes (parallax intra-scène).
- **Carte météo** : le dégradé bleu est conservé, les nuages deviennent des **calques animés** (2 couches qui dérivent à des vitesses différentes), le soleil pulse doucement. Icône soleil dessinée à la main en SVG (plus de FontAwesome).
- **Tuiles Spotify / jeux / hobbies** : on garde l'idée du **voile noir qui monte pour révéler le nom** (`bottom: 100% → 0`), mais réécrit en `clip-path` + `transform` (pas d'animation de `bottom`), avec le libellé qui entre en `translateY` décalé de 120 ms. Correction du bug `opacity: 7`. La pochette scale à `1.06` sous le voile.
- **Pas d'état de chargement** (données statiques). `NcSkeleton` reste au catalogue pour les images lourdes du parallax, mais la scène About n'en a plus besoin — et elle gagne un LCP propre au passage.
- Liens Spotify : `<a target="_blank" rel="noopener noreferrer">` réels (aujourd'hui `window.open` sur un `div`) → accessibilité, clic milieu, aperçu de l'URL.
- Le titre de la tuile reste `about.musics` (« Mon top spotify »). Comme la liste est désormais figée, **ne pas** ajouter de mention « en direct » ou « en ce moment » qui serait mensongère.

### 6.3 Scène 03 — Experience (`#experience`, span 2)

**Contenu (identique) :** 3 expériences (ACII by Audensiel 2021→, Sopra Steria 2020, Sopra Steria 2019), avec leurs sous-missions (Mutuelle de Poitiers, Tempo) et leurs tags technos + textes de détail.

**Traitement :**
- La timeline **bascule à l'horizontale** : la ligne de vie court de gauche à droite au centre de la scène, les cartes alternent au-dessus et en dessous (comme l'alternance gauche/droite actuelle). C'est la transposition naturelle du concept existant.
- La **ligne se dessine** à mesure du scroll (`stroke-dashoffset` sur un SVG, piloté par `--scene-progress`). Les pastilles s'allument quand la ligne les atteint, avec les couleurs existantes (`acii_blue`, `iut_red`, …) et un halo pulsé.
- Les cartes **dépliables** : on garde le mécanisme `grid-template-rows: 0fr → 1fr` (excellent, et déjà en place) mais avec `interpolate-size: allow-keywords` / `calc-size()` quand supporté, plus une rotation du chevron et un déplacement latéral des cartes voisines pour faire de la place (le rail se rallonge : le span de la scène est **dynamique**, recalculé quand une carte s'ouvre — attention à ne pas casser la position de scroll, compenser le delta).
- Les **tags technos** ouvrent la modale de détail (§7.4), colorée par la techno.
- Indicateur d'affordance : les cartes dépliables portent la « pince » visuelle actuelle (le trait interrompu sous la pastille), retravaillée en pointillés animés.

### 6.4 Scène 04 — Skills (`#skills`, span 1.5)

**Contenu (identique) :** `skills.json` intégral — Front-End (8), Back-End (5), Database (5), Tools (6), avec `exp` (années) et `level` (/5) pour chaque techno. Textes `skills.experience` et la pluralisation `skills.exp` (« Aucune | {n} an | {n} ans »).

**Traitement :**
- Les **4 roues** sont conservées — c'est le composant le plus identitaire du site. Réécriture :
  - positionnement des icônes en CSS pur via `--angle: calc(var(--i) * (360deg / var(--count)))` et `transform: rotate(var(--angle)) translateX(var(--radius)) rotate(calc(-1 * var(--angle)))` — plus de calcul JS de `transform` en chaîne de caractères ;
  - la rotation vers l'icône choisie anime une seule variable `--wheel-rotation` (la logique de plus court chemin angulaire du code actuel est conservée et corrigée : aujourd'hui `delta` ne prend jamais le sens inverse, donc la roue tourne parfois presque d'un tour entier — **corriger pour prendre le plus court chemin**, signé) ;
  - durée proportionnelle à l'angle parcouru (comme aujourd'hui), plafonnée à 700 ms, courbe `--ease-spring` ;
  - l'icône sélectionnée grossit, s'entoure d'un anneau de la couleur de la famille, et les autres se ternissent (`opacity: .45`, `filter: saturate(.4)`).
- **Icônes** : devicon et FontAwesome disparaissent. On embarque un **sprite SVG maison** (`app/assets/icons/*.svg` → `<use href="#icon-vue">` via un composant `NcIcon`), en `currentColor`, ~30 glyphes. Poids cible < 25 Ko total. Les logos de marque sont redessinés/simplifiés en monochrome pour rester cohérents (et éviter les soucis de licence des packs d'icônes colorées).
- **Barre de niveau** : conservée, mais animée en `scaleX` depuis l'origine avec un léger dépassement (`--ease-spring`), et graduée (5 encoches). Le nombre d'années reste affiché via la pluralisation i18n.
- Les 4 roues se déploient en cascade à l'entrée de la scène, chacune avec une légère rotation d'arrivée.
- **Clavier** : chaque icône est un `<button>` dans un `role="radiogroup"` ; `←`/`→` font tourner la roue, `Home` revient à la première.

### 6.5 Scène 05 — Education (`#education`, span 1)

**Contenu (identique) :** Formation Vue.js (2023), Polytech Tours (2017-2020, diplôme d'ingénieur), IUT Angoulême (2015-2017, DUT GEII). Couleurs de pastilles : `green`, `polytech_blue`, `red` (→ `iut_red`).

**Traitement :** même composant de timeline horizontale que la scène Experience (`NcTimeline`, variante `compact`, sans dépliage). Différenciation visuelle : fond plus sombre/clair d'un cran, particules `dust` plus denses, et un « fil » de timeline en pointillés plutôt que plein — pour que le lecteur sente que c'est un second temps de la même narration.

### 6.6 Scène 06 — Projects (`#projects`, span 2.5)

**Contenu (identique) :** 4 projets principaux (Prévoyance / MDPA, Portfolio, Solveur de TSP, Hololens RGBD) + 4 « autres » (Tirelire virtuelle, SwalloWin Sound, Premier site web, AJL Peinture), avec descriptions FR/EN, tags, et liens (GitLab, « œil » de démo).

**Traitement :**
- Les cartes défilent **horizontalement dans le sens du rail**.

  > **Écart assumé (L3) :** cette spec prévoyait **deux rangées** décalées. Deux rangées de cartes ne tiennent pas dans la hauteur d'un viewport une fois ajoutés le titre de scène, la rangée de filtres et le volet — mesuré à +540 px de débordement. Le rendu est donc **une seule rangée**, dont une carte sur deux est décalée verticalement et dérive en sens inverse : même sensation de nappe en mouvement, scène lisible.
- **Carte projet** retravaillée à partir de l'existante (`--editor` en fond, `--radius-l`, ombre au survol) :
  - image en `aspect-ratio: 16/10`, `object-fit: contain` sur fond neutre (les logos actuels sont des PNG à fond variable — **normaliser** en amont) ;
  - au survol : élévation, spotlight curseur, légère **rotation 3D** (`rotateX/rotateY` ≤ 4°, `perspective: 900px`), les tags remontent en cascade ;
  - `<a>` réels pour les liens, avec `rel="noopener noreferrer"`, `aria-label` explicite (« Voir le dépôt GitLab de X ») ;
  - l'icône « œil » et le logo GitLab redessinés dans le sprite SVG.
- Le toggle « autres projets » : aujourd'hui c'est un chevron sur une ligne. Devient un **volet latéral** : un clic élargit la scène (son span passe de 2.5 à 4) et les 4 cartes secondaires se déploient à la suite, avec compensation de la position de scroll pour que rien ne saute. Le chevron pointe vers la droite et pivote à l'ouverture. Le libellé est explicite (`projects.other_toggle` — **nouvelle clé i18n à ajouter** : « Autres projets » / « Other projects »), car le chevron seul n'est pas accessible.
- **Filtres par techno** (validé, §13 #6) : une rangée de `NcTag` cliquables qui atténue les cartes non concernées via `filter` + `opacity` et un `transition` sur `order` — ou simple mise en retrait sans reflow.

### 6.7 Scène 07 — Contact (`#contact`, span 2)

**Contenu (identique) :** `contact.title`, la scène parallax Hollow Knight, les 5 points de contact (LinkedIn, GitHub, GitLab, téléphone, e-mail), le formulaire (nom, e-mail, message, envoi), les toasts de succès/erreur, l'easter egg du Chevalier.

**Traitement :**
- La scène parallax devient le **climax** : elle se fige plein écran, les 8 calques glissent horizontalement à leurs profondeurs respectives (§5.2c), les spores s'intensifient.
- **Le formulaire n'arrive qu'une fois le Chevalier assis.** La marche est l'invitation que le panneau « Assieds-toi » énonce ; poser le formulaire à l'écran pendant qu'il traverse encore la caverne y répond avant qu'elle soit faite, et donne surtout autre chose à regarder pendant les deux secondes qui font la scène. Le panneau est donc `visibility: hidden` — pas seulement transparent : un formulaire invisible qui garde ses arrêts de tabulation n'est pas invisible pour tout le monde — et il se pose un temps après lui. Le tout est enfermé dans `@media (--rail)` : en mode empilé il n'y a pas de marche, le Chevalier est déjà sur son banc, et le formulaire est simplement là.
- **S'asseoir se voit** (ce que joue le jeu, dans cet ordre) : le Chevalier vire au blanc pur et lumineux un instant — `brightness(0) invert(1)` aplatit chaque pixel en noir sans toucher à l'alpha, puis l'inverse : sa propre silhouette en blanc, avec un `drop-shadow` qui en épouse la forme parce qu'un `<img>` filtré donne sa silhouette et non sa boîte — puis, une fois redevenu normal, une vingtaine de particules blanches s'échappent de lui et se dispersent brièvement. Les deux temps sont portés par des **éléments à eux** : les sprites du Chevalier portent déjà l'animation de la marche sur le chemin A, et un raccourci `animation` par-dessus réinitialiserait sa timeline et le renverrait à gauche de l'écran. Les particules sont tirées d'une graine fixe, donc le même envol pour tout le monde et pour les captures.
- **Une seule taille de Chevalier.** Le sprite assis vit sur sa propre planche de 87 × 146 et n'est pas à l'échelle de la bande de marche. Il est calé sur le **masque** — la coque blanche, le seul repère qui veuille dire la même chose de profil et de face : 41 lignes source dans une image de marche contre 47 dans la pose assise, donc 41/47 de l'échelle de la marche. Le facteur 1,4 qu'il remplace venait des **largeurs** (45 contre 63), mais il marche de profil et s'assoit de face, et une tête vue de face est simplement plus large que la même tête de profil : s'y fier le rapetissait d'un tiers au moment où il s'asseyait. Son ancrage suit la même logique — ses hanches sont à la ligne 112 des 146, pas le bas de sa boîte, ce qui le pose *sur* la planche avec les jambes par-dessus l'arête plutôt qu'en lévitation derrière le dossier.
- **Easter egg conservé et amélioré** : le sprite `sit_fr/sit_en` (le panneau « Assieds-toi ») rebondit ; au clic sur le banc/Chevalier, le Chevalier apparaît en fondu, le panneau disparaît, **et le thème musical démarre** — mais :
  - lecture **toujours à l'initiative de l'utilisateur** (jamais d'autoplay), volume initial à 0.35, fondu d'entrée de 1,2 s ;
  - un **contrôle visible** apparaît (bouton pause + jauge de volume, style maison), et l'état est annoncé (`aria-live="polite"`) ;
  - le MP3 (4,3 Mo) est **chargé à la demande** (`import()` dynamique / `<audio preload="none">`), jamais dans le bundle initial. Prévoir aussi une version `.ogg`/`.m4a` plus légère.
  - coupure automatique si l'utilisateur quitte la scène.
- **Points de contact** : icônes SVG maison, en `--primary` → `--secondary` au survol (comportement actuel), avec une lueur et un `scale`. Le téléphone : `tel:` sur mobile, **copie dans le presse-papier** sur desktop via `navigator.clipboard.writeText` (remplace `vue3-clipboard`), avec fallback `document.execCommand` et toast maison.
- **Formulaire** (`NcField` + `NcButton`, cf. §7) :
  - libellés flottants conservés (l'implémentation actuelle par `[data-value=""]` est astucieuse mais fragile — la remplacer par `:placeholder-shown` + `:focus-within`, pur CSS, robuste) ;
  - **validation** : nom requis (≥ 2), e-mail requis + format, message requis (≥ 10, ≤ 2000). Messages d'erreur inline, `aria-invalid`, `aria-describedby`, validation au `blur` puis en direct une fois le champ touché ;
  - **honeypot** + délai minimal de remplissage (anti-spam) ;
  - **soumission** : `POST /api/contact`, unique fonction serverless du projet (§2). Elle valide le corps (schéma strict, longueurs bornées), applique un rate-limit par IP (5 requêtes/heure, en mémoire — suffisant pour le trafic d'un portfolio ; passer à Vercel KV si besoin d'un compteur partagé entre instances), puis relaie vers EmailJS ou un SMTP. Les identifiants vivent dans les variables d'environnement Vercel (`NUXT_EMAILJS_*`), jamais dans le bundle ;
  - **états** : `idle → submitting → success | error`, bouton désactivé pendant l'envoi avec un indicateur de progression maison (remplace `BounceLoader`), succès = confettis de spores + message `contact.mail_response.ok`, échec = message `contact.mail_response.ko` qui rappelle l'adresse directe.
- **Pied de scène** : mentions légales minimales, lien vers le dépôt, année, et un bouton « Retour au début » qui rembobine le rail en douceur (`goTo('home')`).

---

## 7. Bibliothèque de composants

> Tous dans `app/components/`, tous en `<script setup lang="ts">`, tous typés, tous avec `defineOptions({ inheritAttrs: false })` quand ils forwardent des attributs, tous testés visuellement. **Aucun composant ne dépend d'une lib tierce.**

### 7.1 Primitives

| Composant | Rôle | API (résumé) |
|---|---|---|
| `NcButton` | Bouton unique du site, 3 variantes | `variant: 'code' \| 'ghost' \| 'solid'`, `size`, `loading`, `disabled`, `as` (`button`/`a`/`NuxtLink`) |
| `NcIcon` | Sprite SVG | `name: IconName`, `size`, hérite `currentColor` |
| `NcHeading` | Titre avec accolades `{{ }}` | `level: 1..3`, `braces: boolean`, animation d'entrée |
| `NcTag` | Pastille techno colorée | `tag: { label, tech, details? }`, clic → modale si `details` |
| `NcField` | Champ texte / textarea, label flottant | `modelValue`, `label`, `type`, `error`, `required`, `maxlength`, `autocomplete` |
| `NcCard` | Surface élevée, spotlight, tilt | `interactive`, `depth`, slots `media`/`body`/`footer` |
| `NcModal` | Dialogue | natif `<dialog>` + `showModal()`, focus trap natif, `::backdrop` flouté, fermeture `Esc`/clic extérieur, transition scale+fade |
| `NcToast` | Notifications | composable `useToast()`, file d'attente, `role="status"`, auto-dismiss 3 s (6 s pour les erreurs), pause au survol, max 3 simultanés |
| `NcSkeleton` | Placeholder de chargement | `variant: 'text' \| 'circle' \| 'rect'`, shimmer |
| `NcSpinner` | Indicateur de progression | anneau SVG `stroke-dasharray`, remplace `vue3-spinner` |
| `NcThemeToggle` | Bascule dark/light | Le toggle soleil/lune actuel (cratères + étoiles) **redessiné proprement** : SCSS invalide corrigé, `<button role="switch" aria-checked>`, transition de vue |
| `NcLocaleSwitch` | Bascule FR/EN | Reprend l'idée du drapeau qui s'écarte, mais **drapeaux en SVG inline** (aujourd'hui chargés depuis `cdn.countryflags.com` — dépendance externe à supprimer). `<button>` + `aria-pressed` |

### 7.2 Composants de scène

| Composant | Rôle |
|---|---|
| `NcRail` | Conteneur du rail, proxy de scroll, provide du contexte |
| `NcScene` | Enveloppe d'une scène : `id`, `span`, `index`, gestion `content-visibility`, expose `--scene-progress` |
| `NcRailNav` | Barre de progression + pastilles + label (§3.7) |
| `NcParticleField` | Champ de particules (§5.3) |
| `NcTimeline` | Timeline horizontale, `variant: 'detailed' \| 'compact'` |
| `NcSkillWheel` | Roue de compétences (§6.4) |
| `NcProjectCard` | Carte projet (§6.6) |
| `NcBentoTile` | Tuile de la grille About, avec voile de révélation |
| `NcContactScene` | Orchestration des huit calques + easter egg |
| `NcNoise` | Overlay de grain (§5.5) |
| `NcCursor` | Curseur personnalisé (§5.4) |
| `NcIntro` | Séquence d'intro machine à écrire (§6.1) |

### 7.3 Conventions

- **Nommage** : préfixe `Nc`, PascalCase, un dossier par famille (`app/components/{primitives,scenes,rail,effects}/`).
- **Props** : `defineProps<T>()` avec interface exportée ; valeurs par défaut via `withDefaults`.
- **Événements** : `defineEmits<{...}>()` typé.
- **Styles** : `<style scoped>` + custom properties pour tout ce qui est thémable. **Aucun `!important`** (le code actuel en a un, à ne pas reproduire). Pas de sélecteur profond sauf `:deep()` justifié.
- **Pas de composant « générique »** : `NcCard` n'est pas une `Card` Bootstrap — c'est la surface de ce site, avec sa lueur, son grain et son élévation propres. Si un composant pourrait être copié-collé dans n'importe quel projet sans qu'on remarque la différence, il est raté.

### 7.4 Modale de détail de tag

Comportement actuel conservé : clic sur un tag → modale titrée du nom de la techno, colorée par `--<tech>-border`, contenant le texte de détail, bouton « OK ». Réécriture sur `<dialog>` natif, avec :
- transition d'ouverture partant de la position du tag (FLIP : on mesure le tag, on anime la modale depuis ce rectangle) ;
- le contenu HTML des détails est du **texte** (aujourd'hui injecté via un slot en chaîne HTML — à ne pas reproduire, risque XSS inutile) ;
- fermeture `Esc`, clic sur `::backdrop`, bouton ; retour du focus sur le tag d'origine.

---

## 8. Responsive

| Palier | Largeur | Comportement |
|---|---|---|
| `xs` | < 480 px | Layout **vertical**, une scène par écran empilée verticalement, snap vertical (`scroll-snap-type: y proximity`). Parallax réduit (2-3 calques par scène), particules à 30 % de densité ou coupées. Nav = points verticaux à droite. |
| `sm` | 480–767 px | Idem `xs`, densités intermédiaires. |
| `md` | 768–1023 px | Vertical, mais mise en page à 2 colonnes là où c'est pertinent (About, Projects). Parallax complet mais amplitude ÷ 2. |
| `lg` | ≥ 1024 px **et** `(pointer: fine)` **et** hauteur ≥ 600 px | **Rail horizontal** complet, tous les effets. |
| `xl` | ≥ 1600 px | Amplitudes de parallax augmentées, grilles plus larges, typo au plafond des `clamp()`. |

**Décision structurante :** le rail horizontal est **desktop-first et desktop-only**. Sur mobile/tablette, le site reste une page unique mais **scrollée verticalement** — mêmes composants, mêmes animations d'entrée (pilotées par `view-timeline` au lieu du rail), même contenu. Un scroll horizontal forcé sur téléphone est inconfortable (conflit avec les gestes système, barre d'URL qui se rétracte, accessibilité) — on ne le fait pas.

L'implémentation ne duplique **pas** les composants : `NcRail` lit un `useRailMode()` qui renvoie `'horizontal' | 'vertical'`, et les scènes déclarent leurs animations en termes de `--scene-progress` (identique dans les deux modes). Seul le conteneur change d'axe. Le basculement se fait au `resize` avec un debounce et une re-synchronisation de la position.

Autres points :
- `100svh` / `100dvh` (jamais `100vh` seul) pour survivre à la barre d'URL mobile.
- `@media (hover: hover)` sur **tous** les effets de survol (le code actuel le fait déjà partiellement via `$not_phone_screen` — généraliser).
- Zones tactiles ≥ 44 × 44 px.
- Tester en orientation paysage sur téléphone (hauteur < 500 px) : layout compact, parallax off.

---

## 9. Données, i18n et API

### 9.1 Structure des données

Toutes les données de contenu passent en **TypeScript typé**, dans `app/data/` :

```ts
// app/data/types.ts
export type TechKey = 'vue' | 'vuex' | 'pinia' | 'vite' | 'react' | /* … */ 'express'

export interface Tag { label: string; tech: TechKey; detailsKey?: string }

export interface TimelineEntry {
  id: string
  dateKey: string; titleKey: string; contentKey: string
  accent: 'green' | 'polytech' | 'acii' | 'iut-red'
  details?: Array<{ dateKey?: string; titleKey?: string; contentKey: string; skills: Tag[] }>
}

export interface Project {
  id: string
  image: string
  titleKey: string; descriptionKey: string; imageAltKey: string
  tags: Tag[]
  links: Array<{ href: string; kind: 'repo' | 'live'; labelKey: string }>
  group: 'main' | 'other'
}

export interface SkillFamily {
  id: 'front' | 'back' | 'database' | 'tools'
  titleKey: string
  skills: Array<{ id: string; name: string; icon: IconName; years: number; level: number }>
}
```

Les **textes** restent dans les fichiers de locale (`i18n/locales/fr.json`, `en.json`), repris **intégralement** de `src/assets/i18n/{fr,en}.js` (structure `navigation`, `home`, `about`, `experience[]`, `skills`, `education[]`, `projects[]`, `other[]`, `contact`). Les structures (ordre, couleurs, tags, liens) vivent dans `app/data/`, référençant les clés i18n. **Aucun texte en dur dans un composant.**

Nouvelles clés à ajouter : `projects.other_toggle`, `a11y.*` (labels de navigation, de boutons icône), `contact.form.errors.*`, `contact.music.{play,pause,label}`, `rail.hint` (« scroll → »), `intro.skip`.

### 9.2 i18n

- `@nuxtjs/i18n` v10, locales `fr` (défaut) / `en`, `strategy: 'prefix_except_default'` → `/` (FR) et `/en` (EN).
- Détection : `localStorage` > `navigator.language` > `fr` (comportement actuel, corrigé : aujourd'hui `availableLocales.includes(window.navigator.language)` échoue pour `fr-FR` — **normaliser sur les 2 premières lettres**).
- `<html lang>` correct, `hreflang` alternates, `og:locale` / `og:locale:alternate`.
- La pluralisation `skills.exp` (« Aucune | {n} an | {n} ans ») est conservée telle quelle.
- Le changement de langue met à jour l'URL sans recharger, conserve la position du rail, et déclenche la transition §5.4.
- Le visuel `sit_fr.png` / `sit_en.png` suit la locale (comportement actuel).

### 9.3 Données runtime : aucune

L'API Express maison (`api.nathancouton.fr`) est **abandonnée**. Les trois jeux de données qu'elle servait deviennent des constantes TypeScript :

```ts
// app/data/about.ts
export const topArtists: SpotifyArtist[] = [/* 4 entrées, cf. annexe A.6 */]
export const topTracks:  SpotifyTrack[]  = [/* 4 entrées, cf. annexe A.6 */]
export const games:      MediaItem[]     = [/* Hollow Knight, Final Fantasy X */]
export const hobbies:    MediaItem[]     = [/* Musique, Australie */]
```

Les backups JSON du dépôt source ne sont pas repris tels quels : le fichier Spotify fait 4 973 lignes pour 8 entrées utiles. On ne garde que les champs réellement affichés (`name`, `url`, `image`, et `artist` pour les titres — ce dernier n'était pas affiché avant mais mérite de l'être).

### 9.4 Côté serveur

```
server/api/contact.post.ts       → validation + rate-limit + relais e-mail (seule fonction)
public/robots.txt                → statique
app/pages/sitemap.xml            → non : généré au build (module ou hook nitro:prerender)
scripts/fetch-remote-assets.ts   → outil de build ponctuel (pochettes Spotify), lancé à la main
```

Le sitemap ne contient plus que 2 URLs (`/` et `/en`) : il est écrit une fois dans `public/`, ou généré par un hook de build. Pas besoin de `@nuxtjs/sitemap` pour deux lignes.

Config : `runtimeConfig.emailjs.*` (serveur uniquement), `runtimeConfig.public.siteUrl`.

---

## 10. Performance, accessibilité, SEO

### 10.1 Budgets (bloquants en CI)

| Métrique | Budget |
|---|---|
| JS initial (gzip) | ≤ 150 Ko, dont ≤ 50 Ko de code applicatif |
| CSS initial (gzip) | ≤ 45 Ko |
| Images au-dessus de la ligne de flottaison | ≤ 250 Ko |
| Poids total au chargement (scène Home) | ≤ 600 Ko |
| LCP (Moto G4, 4G simulée) | ≤ 2,0 s — **mesuré 1,0 s** (desktop, rendu logiciel) |
| CLS | ≤ 0,02 — **mesuré 0,005** |
| INP | ≤ 180 ms |
| Frame time pendant le scroll (desktop mid-range) | ≤ 12 ms au 95e centile |
| Lighthouse (Perf / A11y / Best / SEO) | ≥ 92 / 100 / 100 / 100 — **mesuré 98 / 100 / 96 / 100**. Les 96 en best-practices viennent uniquement des pochettes Spotify bloquées par le proxy de l'environnement de build : en pointant ces URL vers un fichier local, le score passe à 100 (vérifié). |

> **Mesure au lot L0 (socle vide) : 107 Ko de JS gzip.** C'est le plancher de la stack — Vue 3, le runtime Nuxt, vue-router, vue-i18n et color-mode — et il n'est pas compressible sans changer de stack. Le budget initial de 120 Ko écrit avant toute mesure était irréaliste ; il est porté à 150 Ko, dont ~50 Ko de marge réelle pour notre code. Deux vérifications faites à ce stade : `@vueuse/nuxt` est correctement tree-shaké (201 octets d'écart avec ou sans le module, donc il reste), et `i18n.bundle.dropMessageCompiler`, qui faisait gagner 4,7 Ko, **ne peut pas être activé** : il fait traiter chaque message comme un AST précompilé, ce qui casse tout appel à `t()` au runtime. À ne pas réessayer sans précompilation réelle des messages. Le budget est vérifié en CI par `scripts/check-budgets.mjs`, sur les seuls chunks référencés par la page d'accueil prérendue.

**Moyens :** tout le HTML est prérendu et servi depuis le CDN Vercel ; préchargement de la scène Home uniquement ; les scènes 2 à 7 en `defineAsyncComponent` avec hydratation retardée (`hydrate-on-visible` / `<NuxtLazyHydrate>`) ; images AVIF/WebP + `sizes` explicites ; MP3 en `preload="none"` et import dynamique ; sprite SVG unique ; polices self-hostées, 2 graisses, `size-adjust` pour éviter le shift ; pas de polyfill inutile (cible : navigateurs supportant `:has()`, soit ~2023+).

### 10.2 Accessibilité (cible WCAG 2.2 AA)

- **Le contenu existe sans JS et sans animation.** Le HTML rendu par SSR contient tout le texte, dans l'ordre logique. C'est la condition non négociable du parti-pris horizontal.
- Hiérarchie de titres correcte : un seul `h1` (Home), `h2` par scène, `h3` pour les cartes.
- Landmarks : `<header>`, `<main>`, `<nav>`, `<footer>`, `<section aria-labelledby>`.
- **Focus visible** partout : `:focus-visible` avec un anneau de 2 px `--secondary` + offset, jamais supprimé.
- **Focus et rail** : quand un élément prend le focus au clavier dans une scène hors champ, le rail s'y déplace (`scrollIntoView` sur le proxy, instantané si reduced-motion).
- Lien d'évitement « Aller au contenu ».
- Contrastes ≥ 4.5:1 pour le texte, ≥ 3:1 pour les éléments d'interface — **à vérifier en particulier** sur le thème clair (l'orange `#f05f40` sur blanc est à 3.1:1, insuffisant pour du texte : assombrir la variante texte via `color-mix`).
- Toutes les images informatives ont un `alt` ; les calques du parallax sont décoratifs → `alt=""` + `aria-hidden`.
- Aucun contenu porté uniquement par la couleur (les niveaux de compétence affichent aussi une valeur textuelle).
- `prefers-reduced-motion` respecté partout (§5.1.5) ; **pas de flash > 3 Hz** ; pas de mouvement en boucle infini de grande amplitude hors zone de contenu.
- Tests : axe-core en CI (Playwright), navigation clavier complète scénarisée, passage lecteur d'écran (VoiceOver + NVDA) sur les 7 scènes.

### 10.3 SEO

- Rendu SSR/SSG : le HTML servi contient l'intégralité du contenu des 7 scènes.
- `useSeoMeta` par locale : title, description, keywords, OpenGraph, Twitter card — repris de l'`index.html` actuel et enrichis.
- **JSON-LD** `Person` (nom, jobTitle, email, sameAs LinkedIn/GitHub/GitLab, alumniOf, knowsAbout) + `WebSite`.
- `sitemap.xml` régénéré (2 URLs seulement, désormais), `robots.txt`, canonical, `hreflang`.
- **Redirections 301** des anciennes routes (§3.5) — essentiel pour ne pas perdre le référencement acquis sur `/projects`, `/contact`, etc.
- Favicon + `nc_logo_static.png` OG repris tels quels.

---

## 11. Arborescence cible

```
.
├── app/
│   ├── app.vue                      # shell : <NcIntro>, <NcNoise>, <NcCursor>, <NuxtPage>
│   ├── error.vue
│   ├── assets/
│   │   ├── css/{reset,tokens,typography,utilities}.css
│   │   ├── icons/*.svg              # sprite source
│   │   └── img/…                    # repris du dépôt source, retraités
│   │       └── (public/img/spotify/ pour les pochettes rapatriées)
│   ├── components/
│   │   ├── primitives/Nc{Button,Icon,Heading,Tag,Field,Card,Modal,Toast,Skeleton,Spinner,ThemeToggle,LocaleSwitch}.vue
│   │   ├── rail/Nc{Rail,Scene,RailNav}.vue
│   │   ├── effects/Nc{ParallaxLayer,ParticleField,Noise,Cursor,Intro}.vue
│   │   └── scenes/Nc{Home,About,Experience,Skills,Education,Projects,Contact}Scene.vue
│   ├── composables/
│   │   ├── useRail.ts               # contexte du rail
│   │   ├── useRailScroll.ts         # fallback rAF
│   │   ├── useFrameLoop.ts          # orchestrateur rAF unique
│   │   ├── useMotionPreference.ts
│   │   ├── useInView.ts             # IntersectionObserver partagé
│   │   ├── useToast.ts
│   │   └── useContactForm.ts
│   ├── data/{types,timeline,projects,skills,about,contact}.ts
│   ├── pages/index.vue              # unique page : monte les 7 scènes dans NcRail
│   └── utils/{lerp,clamp,mapRange,prng,shortestAngle}.ts
├── i18n/locales/{fr,en}.json
├── public/{favicon.ico,nc_logo_static.png,cv/CV_Nathan_Couton.pdf,…}
├── server/api/contact.post.ts       # unique fonction serverless
├── scripts/fetch-remote-assets.ts   # rapatriement ponctuel des pochettes Spotify
├── tests/{unit,e2e}/
├── nuxt.config.ts
├── vercel.json                      # si un réglage échappe aux routeRules
└── docs/SPEC.md                     # ce document
```

---

## 12. Qualité, tests, livraison

### 12.1 Tests

| Niveau | Outil | Portée |
|---|---|---|
| Unitaire | Vitest | `utils/` (lerp, clamp, shortestAngle, mapRange), logique de la roue de compétences, validation du formulaire, sélection des top Spotify (blacklists + slice) |
| Composant | Vitest + `@nuxt/test-utils` | `NcTag`, `NcField`, `NcModal`, `NcTimeline` (dépliage), `NcSkillWheel` (rotation la plus courte) |
| E2E | Playwright | parcours complet des 7 scènes au scroll ; navigation clavier ; deep-link `/#projects` ; bascule thème ; bascule langue ; soumission du formulaire (API mockée) ; easter egg |
| A11y | axe-core via Playwright | 0 violation « serious » ou « critical » sur les 7 scènes, ×2 thèmes, ×2 langues |
| Visuel | Playwright screenshots | 7 scènes × 2 thèmes × 3 viewports, avec `prefers-reduced-motion: reduce` forcé pour la stabilité |
| Perf | Lighthouse CI | budgets §10.1, bloquant |
| **Smoke runtime** | **Playwright, `npm run smoke`** | **charge le build réel dans Chromium ; toute erreur console, `pageerror` ou réponse ≥ 400 échoue la CI. Non négociable : au L0, un build a passé lint, typecheck, tests et budgets tout en étant une page 500 dans le navigateur.** |

### 12.2 Outillage

- ESLint (`@nuxt/eslint`, flat config) + `stylelint` (ordre des propriétés, interdiction de `!important`, palette limitée aux tokens).
- TypeScript `strict: true`, `vue-tsc` en CI.
- Conventional commits + semantic-release (déjà en place côté GitLab — à porter tel quel).
- Husky/lefthook : lint + typecheck + tests unitaires au pre-push.

### 12.3 Déploiement — Vercel

Plus de Docker, plus de nginx, plus de VPS : le projet est connecté à Vercel, qui build à chaque push.

| Élément | Valeur |
|---|---|
| Preset Nitro | `vercel` (déduit automatiquement de `process.env.VERCEL`, mais on le fixe explicitement) |
| Build | `nuxt build` (avec `nitro.prerender.routes: ['/', '/en']`) |
| Sortie | HTML + assets statiques sur le CDN, une fonction pour `/api/contact` |
| Branche de production | `master` (ou `main`) |
| Preview | une URL par branche / MR, automatique |
| Variables d'env | `NUXT_EMAILJS_SERVICE_ID`, `NUXT_EMAILJS_TEMPLATE_ID`, `NUXT_EMAILJS_PRIVATE_KEY`, `NUXT_PUBLIC_SITE_URL` |
| Domaine | `nathancouton.fr` + `www` → apex, certificat automatique |

**En-têtes** : écrits dans la sortie du build par `scripts/security-headers.mjs`, exécuté après `nuxt build`. Cache immuable sur `/_nuxt/*`, CSP avec **empreintes sha256 des 6 scripts inline** (import map, bootstrap thème/hash, JSON-LD, payload) — `script-src` n'a donc pas besoin de `'unsafe-inline'` ; `style-src` le garde volontairement, Nuxt inlinant une trentaine de blocs `<style>` par page dont le hachage donnerait un en-tête ingérable pour un risque bien moindre. Plus `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`.

Le même script supprime aussi **12 routes de fonction inatteignables** que Nuxt émet pour les anciens chemins de section : la redirection 301 est évaluée avant elles, elles ne pouvaient jamais être appelées.

Le smoke test sert ces en-têtes réels : une CSP qui bloque les scripts inline de Nuxt casse le site, et seul un navigateur le révèle.

**Migration du domaine** : le VPS actuel sert encore le site. Basculer les DNS seulement une fois la preview Vercel validée, et garder le VPS debout quelques jours en repli. Les redirections 301 des anciennes routes (§3.5) doivent être en place **avant** la bascule.

Le pipeline GitLab existant (semantic-release, changelog, tags) peut être conservé pour le versioning, Vercel ne s'occupant que du déploiement. Si le dépôt bascule sur GitHub, l'équivalent en GitHub Actions.

### 12.4 Lots de livraison

| Lot | Contenu | Critère de sortie |
|---|---|---|
| **L0 — Socle** | Projet Nuxt 4, tokens, reset, typo, thèmes, i18n, layout `app.vue`, CI | ✅ **livré** — `/` et `/en` prérendus, squelette thémable, 12 redirections 301 actives, lint + typecheck + 9 tests verts, budgets vérifiés en CI |
| **L1 — Rail** | `NcRail`, `NcScene`, `NcRailNav`, chemins A/B, deep-link, clavier, mode vertical mobile | ✅ **livré** — rail horizontal sur les deux chemins (CSS scroll-driven vérifié, repli rAF vérifié), clavier ←/→/Home/End, `/#skills` atterrit juste, empilement vertical sous 1024 px sans débordement, 33 contrôles runtime verts. Snap doux reporté (cf. note) |
| **L2 — Primitives** | Les 12 composants de `primitives/`, sprite SVG, modale, toasts | ✅ **livré** — 12 primitives, sprite de 56 icônes (16 Ko gzip), galerie `/_dev/kitchen-sink` retirée du build de production, 41 tests |
| **L3 — Contenu** | Données TS + locales complètes, les 7 scènes en version « statique » (structure + contenu, sans effets) | ✅ **livré** — les 7 scènes portent le contenu de v1, en FR et EN, présent dans le HTML prérendu. 47 tests, aucune scène ne déborde de son viewport |
| **L4 — Effets** | Parallax, particules, transitions, curseur, grain, intro | ✅ **livré** — particules sur les 7 scènes, parallax, grain, curseur, intro. Trois effets retirés ou corrigés après mesure (voir §5.4). reduced-motion vérifié, y compris le rail lui-même |
| **L5 — Contact & API** | Routes Nitro, formulaire, easter egg, scène parallax HK | ✅ **livré** — `POST /api/contact` testé sur le bundle déployé (validation, honeypot, délai minimal, rate-limit 5/h), décor Hollow Knight en 13 calques (6,8 Mo de PNG → 278 Ko d'AVIF), easter egg avec contrôles audio visibles |
| **L6 — Finition** | Perf, SEO, JSON-LD, redirections 301, config Vercel, en-têtes, tests visuels | ✅ **livré** — Lighthouse 98 / 100 / 96 / 100 (perf / a11y / best-practices / SEO), 0 violation axe sérieuse sur 3 combinaisons, CSP à empreintes, JSON-LD, sitemap. Reste la bascule DNS, qui est ton geste |

Chaque lot = une MR séparée, revue, avec captures avant/après.

---

## 13. Arbitrages — validés le 21/09/2026

| # | Question | Décision |
|---|---|---|
| 1 | Rendu et hébergement | **Statique, déployé sur Vercel.** Prérendu intégral des deux locales, CDN, une unique fonction serverless pour `/api/contact`. Plus de Docker/nginx/VPS. |
| 1bis | Données Spotify / jeux / hobbies | **Figées en dur.** Le compte Spotify n'existe plus, l'API Express maison est abandonnée. Données reprises du dernier backup (annexe A.6), pochettes rapatriées en local. |
| 2 | SCSS ou CSS natif | **CSS natif** + PostCSS (`postcss-custom-media`). Nesting natif, `color-mix()`, custom properties. Pas de `sass` dans le projet. |
| 3 | Mobile | **Bascule verticale** sous 1024 px. Rail horizontal réservé au desktop avec pointeur fin. |
| 4 | Police | **JetBrains Mono**, self-hostée via `@nuxt/fonts`, graisses 400 et 700. |
| 5 | Icônes | **Sprite SVG monochrome**, `currentColor`, 56 glyphes, 16 Ko gzip. Ni FontAwesome ni devicon au runtime. Les 19 icônes d'interface sont dessinées à la main ; les logos de marque viennent de `simple-icons` (CC0), lu **au build** par `scripts/build-sprite.mjs` — c'est une devDependency, rien n'atteint le bundle. Les 4 marques que simple-icons ne distribue plus (LinkedIn, Oracle, VS Code, Illustrator) sont dessinées à la main. |
| 6 | Filtres par techno sur Projects | **Oui.** Rangée de `NcTag` cliquables, mise en retrait des cartes non concernées, sans reflow. |
| 7 | Easter egg musical | **Conservé.** Chargement à la demande, jamais d'autoplay, contrôles visibles, MP3 réencodé (~1,5 Mo). |
| 8 | Assets parallax Hollow Knight | **Conservés**, avec crédit discret en pied de scène Contact. |
| 9 | Blog | **Supprimé.** Le stub disparaît, pas de 8e scène. |
| 10 | « Autres projets » | **Volet qui étend le rail** (span 2.5 → 4), avec compensation de la position de scroll. |
| 11 | Curseur personnalisé | **Oui**, discret, désactivé sur pointeur grossier et en reduced-motion, curseur natif préservé sur les zones de saisie. |
| 12 | Analytics | **Non.** Aucun traceur, aucun bandeau de consentement. |

### 13.1 Ce que le passage en statique change concrètement

- **Supprimé** : les 3 routes de proxy (`/api/spotify`, `/api/games`, `/api/hobbies`), le cache Nitro, les fallbacks JSON, la gestion d'erreur réseau, les états de chargement de la scène About, la variable `NUXT_API_BASE`, et toute la logique de filtrage au runtime (les blacklists sont appliquées une fois, à la main, en figeant les données).
- **Ajouté** : `scripts/fetch-remote-assets.ts` pour rapatrier les 8 images Spotify (à lancer en local — le domaine `i.scdn.co` est injoignable depuis l'environnement d'agent), et les `routeRules` de redirection 301 en remplacement du middleware Nitro.
- **Inchangé** : tout le reste. Le contenu affiché est identique à celui du site actuel ; seule sa provenance change.
- **Dette assumée** : le top Spotify ne bougera plus. C'est un instantané de 2024. Si le sujet revient, deux voies propres : un job de build qui rafraîchit les données via l'API Spotify (nécessite un compte et un refresh token), ou assumer une rubrique « ce que j'écoutais » datée.

## 14. Définition de « terminé »

Le projet est livré quand, simultanément :

1. Les 7 scènes contiennent **exactement** les informations du site actuel, en FR et en EN.
2. Le défilement de la molette fait avancer le contenu **de gauche à droite**, de façon fluide (≤ 12 ms/frame au 95e centile sur une machine milieu de gamme).
3. Parallax multi-couches et champ de particules sont présents sur **toutes** les scènes, avec le traitement Hollow Knight complet sur Contact.
4. **Aucune dépendance de composants UI tierce** n'apparaît dans `package.json`.
5. Le site est utilisable au clavier, au lecteur d'écran, sans JS pour la lecture du contenu, et respecte `prefers-reduced-motion`.
6. Sur mobile, le site est agréable (mode vertical), sous les budgets de poids.
7. Les budgets §10.1 sont tenus et vérifiés en CI.
8. Les anciennes URL redirigent en 301 et le SEO est au moins équivalent.
9. Le pipeline build → image → déploiement fonctionne de bout en bout.

---

## Annexe A — Inventaire du contenu à reprendre

### A.1 Expériences (3)

| Période | Entreprise | Rôle | Sous-missions | Technos |
|---|---|---|---|---|
| 2021 → aujourd'hui | ACII by Audensiel | Développeur Fullstack Java / Vue.js | **Mutuelle de Poitiers Assurances** (2021→, dév. d'application web) ; **Tempo** (2021, dév. d'application web) | Vue 2, Java 8, Spring, Agile / Angular 11, Java 15, Spring, Agile |
| 2020 | Sopra Steria | Stage développeur Java / Angular | Migration Flex → Angular 2, évolutions et correctifs (gestion des professionnels de santé, dossiers médicaux) | Angular, Java, Agile |
| 2019 | Sopra Steria | Stage développeur Java / Flex | Évolutions et correctifs sur les mêmes applications | Flex, Java |

Chaque techno porte un texte de détail (affiché en modale) — repris intégralement de `fr.js` / `en.js`.

### A.2 Formations (3)

| Période | Établissement | Diplôme / objet | Accent |
|---|---|---|---|
| 2023 | — | Formation Vue.js de 3 jours (consolidation Vue 2, découverte Vue 3) | `green` |
| 2017 – 2020 | Polytech Tours | Diplôme d'ingénieur informatique | `polytech` (#009fe3) |
| 2015 – 2017 | IUT Angoulême | DUT Génie Électronique et Informatique Industrielle | `iut-red` (#bf1e2e) |

### A.3 Projets principaux (4)

| Projet | Technos | Liens |
|---|---|---|
| Prévoyance (Mutuelle de Poitiers Assurances) | Vue 2, TS, VueX, Java | — |
| Portfolio | Vue 3, Vite, Pinia, Express | GitLab |
| Application web de solveur de TSP | JQuery, p5, Bootstrap | GitLab + démo |
| Hololens RGBD Stream en nuage de points | Unity, C#, C++ | GitLab + démo |

### A.4 Autres projets (4)

| Projet | Technos | Liens |
|---|---|---|
| Tirelire virtuelle | Angular, Java, Bootstrap, Agile | — |
| SwalloWin Sound | Android, Java | démo |
| Mon premier site web | Html, Css, Js, JQuery, Bootstrap | démo (`ancien-{locale}.nathancouton.fr`) |
| AJL Peinture | React, Firebase, Bootstrap | démo |

### A.5 Compétences

**Front-End** : Vue (2 ans, 4/5) · JavaScript (4, 4) · TypeScript (3, 4) · Sass (2, 3) · Angular (2, 3) · Bootstrap (4, 4) · HTML 5 (5, 5) · React (1, 2)
**Back-End** : Java (3, 4.5) · Spring (3, 4) · Node.js (2, 3) · C# (1, 2) · .NET Core (1, 1.5)
**Database** : Oracle (5, 4.2) · PostgreSQL (3, 3.5) · MySQL (5, 4) · Firebase (1, 2.1) · MongoDB (1, 2.2)
**Tools** : IntelliJ (5, 4.5) · VS Code (3, 4) · GitLab (4, 4) · GitHub (4, 3.5) · Docker (1, 2.5) · Illustrator (2, 2.7)

### A.6 About

Photo de profil · Tours, département 37 · « Curieux - Esprit d'équipe » · « J'aime les challenges » · Logo employeur.

**Top Spotify — figé** (extrait du backup après application des filtres historiques : artiste exclu « Lorenzo », titre exclu « Zorro est arrivé », album exclu « Aqua Regia », puis `slice(0, 4)`) :

*Artistes*

| Nom | Lien | Image d'origine (à rapatrier) |
|---|---|---|
| Sleep Token | `open.spotify.com/artist/2n2RSaZqBuUUukhbLlpnE6` | `i.scdn.co/image/ab6761610000e5ebdbc568c9d871256b9a3e34a1` |
| Periphery | `open.spotify.com/artist/6d24kC5fxHFOSEAmjQPPhc` | `i.scdn.co/image/ab6761610000e5ebae2304891734b9d9fafe1c8d` |
| Bad Omens | `open.spotify.com/artist/3Ri4H12KFyu98LMjSoij5V` | `i.scdn.co/image/ab6761610000e5eb1ffa2e19b87dceb11074b564` |
| Tenacious D | `open.spotify.com/artist/1XpDYCrUJnvCo9Ez6yeMWh` | `i.scdn.co/image/ab6761610000e5eb7637f18f419921b8d24bd9e5` |

*Titres*

| Titre | Artiste | Album | Lien | Pochette d'origine (à rapatrier) |
|---|---|---|---|---|
| Take Me Back To Eden | Sleep Token | Take Me Back To Eden | `open.spotify.com/track/2Gt7fjNlx901pPRkvBiNBZ` | `i.scdn.co/image/ab67616d0000b273c3d08e1763e769586bab1c97` |
| Dracul Gras | Periphery | Periphery V: Djent Is Not A Genre | `open.spotify.com/track/23DnPpIoSRcYN04PI4bKku` | `i.scdn.co/image/ab67616d0000b273fef6779b6098e01e5e4a68f7` |
| Rain | Sleep Token | Take Me Back To Eden | `open.spotify.com/track/0GXwlEXCO8qeeeOIYpsR3m` | `i.scdn.co/image/ab67616d0000b273c3d08e1763e769586bab1c97` |
| Like A Villain | Bad Omens | THE DEATH OF PEACE OF MIND | `open.spotify.com/track/0xoyUiHhxVH4gwb0CRgNmg` | `i.scdn.co/image/ab67616d0000b273e5f6f7ec99735d7b870f18ae` |

> Les deux titres de Sleep Token partagent la même pochette : 7 fichiers distincts à rapatrier, pas 8.
> Le nom de l'artiste n'était pas affiché sur le site actuel ; il l'est maintenant (sous le titre, en `--surface-dim`).

**Jeux — figés** : Hollow Knight (`images.igdb.com/igdb/image/upload/t_cover_big/co4hc2.png`) · Final Fantasy X (`…/co1tr1.png`). Mêmes remarques : rapatrier les jaquettes.

**Hobbies — figés** : Musique (`assets/img/musique.jpg`) · Australie (`assets/img/australie.jpg`) — déjà locaux dans le dépôt source.

### A.7 Contact

`contact@nathancouton.fr` · `06 46 89 82 23` · [LinkedIn](https://www.linkedin.com/in/nathan-couton/) · [GitHub](https://github.com/nath7098) · [GitLab](https://gitlab.com/nath7098) · CV PDF.

---

## Annexe B — Correctifs hérités à ne pas reconduire

| Fichier source | Problème | Traitement |
|---|---|---|
| `AboutView.vue` | `opacity: 7` sur `.track__name:hover` | `opacity: .9` |
| `NcThemeSwitch.vue` | `border-radius: 90px - 6` (SCSS invalide) | `border-radius: 84px` |
| `nginx.conf` | `root /urs/share/nginx/html` | sans objet — nginx disparaît avec le passage sur Vercel |
| `ContactView.vue` | `.knight:hover + .bench::before { content: "TEST" }` | supprimé |
| `ContactView.vue` | 15 écritures de `style.marginTop` par frame de scroll | custom properties + transform composité |
| `ContactView.vue`, `NavBar.vue` | `addEventListener('scroll')` jamais retiré | `useEventListener` (auto-cleanup) |
| `stores/app.js` | `infos`, `education`, `experience`, `project`, `skills` déclarés mais non retournés | supprimés |
| `AboutView.vue` | `key="gameLoading"` sur 3 loaders différents | clés uniques (ou plus de loaders) |
| `App.vue`, `AboutView.vue`, `ContactView.vue` | `console.log` de debug | supprimés |
| `NcLanguageSelect.vue` | drapeaux chargés depuis `cdn.countryflags.com`; mutation d'un `computed` (`selected.value = …`) | SVG inline + état local correct |
| `App.vue` | `availableLocales.includes(navigator.language)` échoue sur `fr-FR` | normalisation sur les 2 premières lettres |
| `NcTag.vue` / `NcModal.vue` | détails injectés en chaîne HTML dans un slot | passage en texte |
| Global | `!important` sur `.theme__switch` | résolu par la spécificité |
