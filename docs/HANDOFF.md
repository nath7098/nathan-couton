# Passation — portfolio Nathan Couton v2

> Pour l'agent ou le développeur qui reprend ce projet.
> La **spec fait foi** : [`SPEC.md`](SPEC.md). Ce document dit **où on en est**,
> **comment vérifier son travail**, et **ce qui fait perdre du temps ici**.
> Dernière mise à jour : fin du lot L6.

---

## 1. En une minute

Refonte en Nuxt 4 du portfolio [gitlab.com/nath7098/personal-website](https://gitlab.com/nath7098/personal-website).
Page unique, **défilement horizontal** : on scrolle, le contenu file de gauche à
droite à travers sept scènes. Aucune librairie de composants UI, tout est écrit
à la main.

**Les six lots de la spec sont livrés.** Le site est complet et mesuré :
Lighthouse 98 / 100 / 96 / 100, zéro violation axe sérieuse, budgets tenus.
Il n'est **pas encore en production** — la bascule DNS reste à faire (§6).

| Lot | Contenu | État |
|---|---|---|
| L0 | Socle : Nuxt 4, tokens, thèmes, i18n, CI | ✅ |
| L1 | Rail horizontal, navigation, mode vertical mobile | ✅ |
| L2 | 12 primitives, sprite de 56 icônes | ✅ |
| L3 | Contenu des sept scènes, FR + EN | ✅ |
| L4 | Particules, parallax, grain, curseur, intro | ✅ |
| L5 | Formulaire de contact, scène Hollow Knight | ✅ |
| L6 | SEO, en-têtes de sécurité, audits | ✅ |

---

## 2. La règle de travail

```bash
npm run verify
```

Enchaîne lint → typecheck → 71 tests unitaires → build → test d'API →
38 contrôles runtime → Lighthouse → budgets de poids. **C'est ce que la CI
exécute.** Rien n'est « livré » tant que ça n'est pas vert.

| Commande | Rôle |
|---|---|
| `npm run dev` | développement |
| `npm run check` | lint + typecheck + tests unitaires (rapide) |
| `npm run smoke` | charge le build réel dans Chromium ; exige un `build` préalable |
| `npm run test:api` | exerce `POST /api/contact` sur le bundle déployé |
| `npm run lighthouse` | audit sur la sortie de build |
| `npm run icons` | régénère le sprite et `app/utils/icon-names.ts` |
| `npm run assets:fetch` | rapatrie les pochettes Spotify / IGDB en local |

En local, `CHROMIUM_PATH` pointe un binaire Chromium déjà présent.

### La leçon la plus chère de ce projet

Au lot L0, un build a passé **lint, typecheck, 9 tests unitaires et les budgets
de poids** tout en étant une **page 500 dans le navigateur**. Aucune
vérification statique ne pouvait l'attraper.

`scripts/smoke.mjs` existe pour ça : il charge le build réel, sert les en-têtes
réels du déploiement, et échoue sur toute erreur console. **Ne jamais annoncer
un lot terminé sans qu'il soit passé, et sans avoir regardé une capture.**
Plusieurs défauts majeurs de ce projet (easter egg inatteignable, décor réduit
à un rectangle, contenu hors écran) n'ont été vus qu'à l'œil.

---

## 3. Pièges connus — à lire avant de toucher à la config

Chacun de ces points m'a coûté du temps. Ils sont commentés dans le code à
l'endroit concerné ; cette liste sert d'index.

### i18n

- **Ne pas activer `i18n.bundle.dropMessageCompiler`.** Il fait traiter chaque
  message comme un AST précompilé ; nos messages sont des chaînes, et le premier
  `t()` lève `unhandled node type: 0` à l'hydratation. Nuxt affiche alors sa page
  500. Gain annoncé : 4,7 Ko. Coût réel : le site.
- **Les messages sont importés statiquement** dans `i18n/i18n.config.ts`. Ne pas
  repasser à `langDir` : le serveur de développement répond alors 404 sur les
  fichiers de locale et chaque `t()` retombe silencieusement sur la clé brute,
  pendant que le build de production reste vert.
- **`detectBrowserLanguage` est désactivé volontairement.** Tout est prérendu :
  laisser le client rediriger un navigateur anglais vers `/en` après hydratation
  garantit un mismatch de markup. La détection `Accept-Language` appartient à
  l'edge Vercel.
- **Ne pas figer `html lang` dans `nuxt.config`** : ça écrase i18n et `/en`
  s'annonce en français.

### Rail et scroll

- **Le fragment d'URL est déjà consommé** quand le `setup` d'un composant
  s'exécute (le router normalise l'URL contre la route prérendue). Il est capturé
  par un script inline dans le `<head>` → `window.__ncHash`.
- **Le `scrollBehavior` du router est neutralisé** (`app/router.options.ts`) : il
  écrasait la position du rail.
- **Les animations pilotées par le scroll sont exclues de `prefers-reduced-motion`.**
  `rail-slide` et `scene-sweep` *sont* le rail, pas de la décoration. Les ramener
  à `0.01ms` projette le track à sa position finale et fige chaque scène — le
  site cesse de fonctionner. Réduire le mouvement veut dire supprimer ce que
  l'utilisateur n'a pas demandé, pas le défilement qu'il est en train de faire.

### CSS et build

- **`postcss.plugins` attend des options, pas des instances de plugins.** Passer
  une instance ne produit aucune erreur : `@media (--rail)` part brut dans le CSS
  et le rail ne s'active jamais.
- **`components.pathPrefix: false`** est nécessaire : sans lui, un composant dans
  `components/primitives/` s'auto-importe sous `PrimitivesNcThemeToggle`.
- **Nuxt inline les styles** de la page prérendue (une trentaine de blocs
  `<style>`). Un budget CSS qui ne compte que les fichiers liés sous-estime d'un
  facteur dix.
- **Ne pas arrondir les coordonnées des paths SVG.** En SVG, `.405.874` est une
  séquence de *deux* nombres ; réécrire le premier en `0.40` donne `0.400.87`,
  que le parseur découpe autrement. Ça avait rendu les logos GitHub et GitLab
  méconnaissables.

### Performance

Trois effets plein écran coûtaient **chacun la moitié du budget de frame** :

- **`mix-blend-mode` sur toute la surface** : médiane 16,7 → 33,3 ms. Retiré.
- **`skewY` sur le rail** : 33 → 67 ms, mesuré de trois façons. La surface à
  déformer fait 1150 vw quelle que soit la découpe ; regrouper les scènes sous un
  calque unique a *empiré* les choses. Effet abandonné.
- **`inset: -50%`** sur le grain quadruplait la surface composée pour un
  déplacement de ±2 %.

Règle : **mesurer tout effet appliqué à une grande surface avant de le garder.**
`npm run smoke` surveille le temps de frame au défilement.

### Mise en page

- **Un `z-index` négatif rend les boutons inaccessibles au clic.** Le décor
  Hollow Knight était derrière le contenu, donc l'easter egg était
  inatteignable.
- **`align-content: center` réduit la boîte à la hauteur du contenu.** Un décor
  en `inset: 0` ne couvrait alors que le paragraphe. `.scene__body` a désormais
  une rangée pleine hauteur et chaque scène centre son propre contenu.
- **Les scènes larges ne centrent pas leur contenu.** Contact fait deux
  viewports : centrer place le contenu hors écran à l'arrivée.

### Tests

- **`overflow: hidden` rend `scrollHeight` aveugle.** Mon premier contrôle de
  débordement affichait un vert rassurant alors qu'une scène dépassait de 540 px.
  Il mesure maintenant les boîtes des enfants.
- **Un seul serveur de dev à la fois.** J'ai perdu plusieurs cycles à tester une
  instance périmée pendant que la nouvelle tournait sur un autre port. `ps aux |
  grep nuxt` avant de conclure.
- **La machine est partagée.** Les mesures de frame doublent quand un build tourne
  à côté ; le test en prend deux et garde la meilleure.
- **Un test de contraste maison ne remplace pas axe.** Le mien ne regardait que
  six éléments choisis ; axe a trouvé deux familles de violations réelles.

---

## 4. Architecture en bref

```
app/
├── assets/css/     tokens, reset, typographie, rail, breakpoints nommés
├── components/
│   ├── primitives/ les 12 composants de base (NcButton, NcField, NcModal…)
│   ├── rail/       NcRail, NcScene, NcRailNav — le mécanisme de défilement
│   ├── effects/    particules, parallax, grain, curseur, intro
│   └── scenes/     une par section, plus NcTimeline, NcSkillWheel, NcHollowScene
├── composables/    useRail, useFrameLoop, useMotionPreference, useContactForm…
├── data/           scènes, timeline, projets, compétences, about, parallax
└── pages/index.vue page unique, monte les sept scènes dans NcRail
i18n/               i18n.config.ts + locales/{fr,en}.ts
server/             api/contact.post.ts + utils (validation, rate-limit)
scripts/            build-sprite, security-headers, smoke, test-api, lighthouse…
```

**Principes à ne pas casser :**

- La **structure** vit dans `app/data/` (TypeScript typé), les **mots** dans
  `i18n/locales/`. Aucun texte en dur dans un composant.
- **Une seule boucle rAF** pour tout le site (`useFrameLoop`). Pas de rAF par
  composant.
- N'animer que `transform`, `opacity`, `filter` et des custom properties.
- Les composants lisent les **custom properties CSS** du rail (`--rail-progress`,
  `--scene-progress`), pas l'état JS, quand c'est possible.
- Les icônes passent uniquement par `<NcIcon name="…" />`, dont les noms sont
  **générés** par `npm run icons`.

---

## 5. Écarts assumés à la spec

Trois, tous documentés dans `SPEC.md` à leur section :

1. **Pas de skew cinétique** (§5.4) — mesuré à la moitié du budget de frame.
2. **Les projets tiennent sur une rangée, pas deux** (§6.6) — deux rangées
   débordaient de 540 px en hauteur. Le décalage vertical alterné rend le même
   effet.
3. **Pas de snap doux** (§3.4) — reporté puis jugé non nécessaire : le
   défilement libre est confortable et un snap mal réglé se bat avec
   l'utilisateur. À reprendre si l'usage le réclame.

---

## 6. Ce qui reste à faire

**Avant la bascule DNS** — ces points demandent un accès dont l'agent ne dispose
pas :

1. **Renseigner `NUXT_EMAILJS_*` dans Vercel.** Sans ces variables, le formulaire
   répond 503 et affiche le message qui rappelle l'adresse directe. La clé privée
   est optionnelle mais recommandée : elle rend l'appel server-only.
2. **`npm run assets:fetch`**, puis faire pointer `app/data/about.ts` sur
   `/img/remote/`. Les pochettes Spotify et les jaquettes IGDB dépendent encore
   de CDN tiers dont les URL peuvent expirer. Une tuile dont l'image échoue
   affiche proprement son nom, mais c'est un repli, pas une solution.
   *C'est aussi ce qui fait plafonner Lighthouse best-practices à 96 : servies
   localement, le score atteint 100 (vérifié).*
3. **Réencoder `public/audio/hollow-knight-theme.mp3`** — 4,4 Mo, repris tel quel
   de v1, aucun outil audio n'était disponible. Il est en `preload="none"`, donc
   il ne pèse sur aucun chargement de page, mais ~1,5 Mo serait plus décent.
4. **Valider la preview Vercel, puis basculer les DNS.** Garder le VPS quelques
   jours en repli. Les redirections 301 doivent être actives avant.

**Points de vigilance pour la suite :**

- **Le budget JS est à 136 Ko sur 150 (91 %).** Le plancher de la stack
  (Vue + Nuxt + router + i18n + color-mode) est à ~107 Ko et n'est pas
  compressible. Toute fonctionnalité notable demandera de différer l'hydratation
  des scènes hors champ (`hydrate-on-visible`).
- **Lighthouse tourne ici en rendu logiciel sans GPU.** Les scores de perf sont
  pessimistes et les seuils de frame du smoke sont des détecteurs de régression,
  pas le budget de la spec. La mesure de référence se fait sur une vraie machine.
- **Le top Spotify est un instantané figé de 2024** (le compte n'existe plus).
  Ne pas ajouter de mention « en ce moment » qui serait mensongère.

---

## 7. Contexte utile

- **Branche de travail** : `claude/serene-albattani-gtubp9`.
- **Historique** : un commit par lot, message détaillé expliquant les décisions
  et les corrections. `git log` est une bonne lecture avant de reprendre.
- **Source de contenu** : le site v1 reste la référence pour les textes. Une
  quinzaine de bugs hérités ont été corrigés au passage — ils sont listés en
  annexe B de `SPEC.md` ; ne pas les réintroduire en recopiant v1.
