# Passation — portfolio Nathan Couton v2

> Pour l'agent ou le développeur qui reprend ce projet.
> La **spec fait foi** : [`SPEC.md`](SPEC.md). Ce document dit **où on en est**,
> **comment vérifier son travail**, et **ce qui fait perdre du temps ici**.
> Dernière mise à jour : refonte « Compile → Run » (L7–L16) — le rail
> horizontal devient un document vertical suivi d'un final épinglé. Voir
> SPEC §14 pour les arbitrages.

---

## 1. En une minute

Refonte en Nuxt 4 du portfolio [gitlab.com/nath7098/personal-website](https://gitlab.com/nath7098/personal-website).
**Code vertical, monde horizontal** : du hero aux projets, la page défile comme
un fichier (lisible en diagonale, cherchable au Ctrl+F) ; au seuil du contact,
`$ npm run contact` se tape dans un terminal, ses volets s'ouvrent sur
Greenpath, et le Chevalier traverse une scène épinglée pour s'asseoir sur le
banc. Aucune librairie de composants UI.

| Lot | Contenu | État |
|---|---|---|
| L0–L6 | Socle, rail, primitives, contenu, effets, contact, SEO | ✅ (rail remplacé en L9) |
| L7–L8 | Polices auto-hébergées, design system (accent stable, 3 voix typo) | ✅ |
| L9 | Bascule d'axe : document + final épinglé, en-tête, pied de page | ✅ |
| L10 | Hero (proposition de valeur, `whoami.ts`), intro « npm run build » | ✅ |
| L11 | Parcours en `git log --graph` | ✅ |
| L12 | Profil (bio, chiffres, faits, « hors écran » daté) | ✅ |
| L13 | Compétences en scopes `pom.xml` | ✅ |
| L14 | Projets : études de cas + figures, archives | ✅ |
| L15 | Atmosphère (lavis Greenpath, particules), terminal du seuil | ✅ |
| L16 | ⌘K, CTA magnétique, scripts, doc | ✅ |

Mesures (build local, rendu logiciel) : Lighthouse desktop **93 / 100 / 100 /
100**, JS critique **124 kB** gzip (136 avant la refonte), smoke vert. Le site
n'est **pas encore en production** (§6).

---

## 2. La règle de travail

```bash
npm run verify
```

Enchaîne lint → typecheck → tests unitaires → build → test d'API →
contrôles runtime (smoke) → Lighthouse → budgets de poids. **C'est ce que la CI
exécute.** Rien n'est « livré » tant que ça n'est pas vert.

| Commande | Rôle |
|---|---|
| `npm run dev` | développement |
| `npm run check` | lint + typecheck + tests unitaires (rapide) |
| `npm run smoke` | charge le build réel dans Chromium ; exige un `build` préalable |
| `npm run test:api` | exerce `POST /api/contact` et `GET /api/soundtrack` (Last.fm simulé) sur le bundle déployé |
| `npm run lighthouse` | audit sur la sortie de build |
| `npm run icons` | régénère le sprite et `app/utils/icon-names.ts` |
| `npm run shots` | captures du parcours complet sur le build (6 configurations) — à regarder |

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

### Document, final et scroll

- **Le fragment d'URL est déjà consommé** quand le `setup` d'un composant
  s'exécute (le router normalise l'URL contre la route prérendue). Il est capturé
  par un script inline dans le `<head>` → `window.__ncHash`, qui traduit au
  passage les anciennes ancres (`#experience`, `#education` → `#parcours`).
- **Le `scrollBehavior` du router est neutralisé** (`app/router.options.ts`) :
  c'est `useSections` qui place la page.
- **Rien entre `<html>` et le final ne doit créer de conteneur de défilement**
  (`overflow` autre que `visible`/`clip` sur l'axe bloc) **ni sauter le rendu**
  (`content-visibility`). Sinon `sticky` ne colle plus et la `view-timeline
  --finale` se détache du scroll du document : la scène reste immobile.
- **Les plages d'animation du final sont relatives à la piste, pas au
  document.** `--open-from`, `--walk-from`, `--walk-to` viennent de
  `finaleMarks()` et sont publiées en style inline statique ; ne jamais revenir
  à des fractions de `scroll(root)`, qui dépendent de la hauteur de tout ce qui
  précède (langue, largeur, polices).
- **Ne jamais annuler un mouvement par une contre-transformation.** La première
  scène Contact compensait la course du rail avec une « caméra » : les deux
  transformations ne tombaient jamais d'accord et la scène tremblait. Le final
  est immobile par construction (`sticky`) ; seuls ses calques bougent.
- **Ne pas animer une propriété personnalisée partagée pour piloter un décor.**
  Une propriété personnalisée animée coûte un recalcul de style complet par
  frame. Chaque élément anime son propre `transform` entre deux valeurs
  concrètes ; `--walk`, `--run`, `--open` ne servent qu'au chemin B, écrites
  sur la section et jamais sur `<html>`.
- **`scrollIntoView()` atterrit 50 px trop bas sur mobile** (Chromium en
  émulation mobile y ajoute la barre d'outils). `useSections.goTo()` calcule sa
  cible et lit le `scroll-margin-top` de la section.
- **Ne pas cumuler `scroll-padding-top` sur `<html>` et `scroll-margin-top` sur
  les sections** : les deux s'additionnent.

### Vue et CSS scopé

- **`:global(x) .a .b` dans un style `scoped` devient `x` tout seul.** Vue
  remplace le sélecteur entier par le contenu de `:global()`. Une règle
  `:global([data-step='work']) .figure …` a ainsi estompé à 18 % tous les
  éléments portant `data-step` — les études de cas entières. Écrire
  `.parent[data-step='work'] :deep(.enfant)` depuis le composant parent, ou
  `:root[data-theme=…] .classe` pour un attribut racine.

### CSS et build

- **`postcss.plugins` attend des options, pas des instances de plugins.** Passer
  une instance ne produit aucune erreur : `@media (--stage-wide)` part brut dans
  le CSS et la marche du final ne s'active jamais.
- **Les polices sont commitées** (`public/fonts`, `assets/css/fonts.css`). Le
  provider `google` de `@nuxt/fonts` échouait sans rien dire quand Google était
  injoignable depuis la machine de build : aucune `@font-face`, tout le site en
  monospace système.
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
  inatteignable. L'atmosphère est à `z-index: 0` sous un `main` à 1.
- **Un titre d'un seul mot peut élargir toute la grille.** « Compétences » en
  `--step-5` faisait 395 px sur un écran de 390 : la colonne implicite `auto`
  de `.section__inner` suivait. Les grilles de section sont en
  `minmax(0, 1fr)` et les paliers de titre ont un plancher plus bas.
- **Un en-tête doit tenir à toutes les largeurs de bureau.** Le smoke vérifie
  1440, 1280 et 1024 : la pastille de statut part sous 1440, l'indice ⌘K sous
  1180.
- **Au-dessus du décor, l'en-tête devient transparent — sur grand écran
  seulement.** Sous `--stage-wide`, le formulaire suit la scène dans le flux
  et passerait sous un en-tête transparent.

### Tests

- **`pkill -f motif` tue aussi le shell qui l'exécute** si la ligne de commande
  contient le motif (code 144). Tuer par PID.
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
├── assets/css/     fonts, tokens, reset, typographie, sections, breakpoints
├── components/
│   ├── primitives/ NcButton, NcTag, NcField, NcModal, NcHeading…
│   ├── layout/     NcSiteHeader, NcSection, NcSiteFooter, NcNowPill
│   ├── finale/     NcFinale (piste + scène + dock), NcTerminal, NcContactPanel
│   ├── scenes/     hero, profil, NcGitGraph, compétences, NcCaseStudy + NcFigure,
│   │               NcHollowScene (Greenpath)
│   └── effects/    NcAtmosphere, NcParticleField, NcIntro, NcCursor,
│                   NcCommandPalette (⌘K, chargée à la demande)
├── composables/    useSections, useFinale, useFrameLoop, useMagnetic…
├── data/           sections, now, parcours, skills, projects, about, parallax
└── utils/          finale-geometry, git-graph, figure-geometry, particles…
```

**Principes à ne pas casser :**

- La **structure** vit dans `app/data/`, les **mots** dans `i18n/locales/`.
- **Tout ce qui dépend du temps** part de `CONTENT_AS_OF` (`data/now.ts`),
  jamais de `new Date()` : prérendu et hydratation doivent calculer pareil.
- **Une seule boucle rAF** (`useFrameLoop`).
- N'animer que `transform`, `opacity`, `filter`, `clip-path` sur petit élément.
- **Mesurer tout effet plein écran** avant de le garder (le smoke surveille le
  temps de frame).
- Le **contenu est dans le HTML prérendu** et les sections sous la ligne de
  flottaison ne sont hydratées qu'à l'approche (`hydrate-on-visible`). Le final
  est hydraté d'emblée : il mesure la page pour le lien « Contact ».
- Icônes via `<NcIcon name="…" />` uniquement.

### Le final, en détail

| Fichier | Ce qu'il décide |
|---|---|
| `app/utils/finale-geometry.ts` | Les segments `run` / `open` / `walk` / `hold`, en hauteurs d'écran, large et étroit. `splitFinale()` et `finaleProgress()`. |
| `app/composables/useFinale.ts` | `arrived`, `walking`, chemin B, accrochage vers l'avant, position du formulaire pour la navigation. |
| `app/components/finale/NcFinale.vue` | La piste (`view-timeline --finale`), la scène sticky, le dock du formulaire. |
| `app/components/finale/NcTerminal.vue` | `$ npm run contact`, les logs, les six volets. |
| `app/components/scenes/NcHollowScene.vue` | Les calques, le banc, le Chevalier, la lueur et les particules, la musique. |
| `app/data/parallax.ts` | La table des calques, `PAN`, `KNIGHT_START`, `FIGURE_SCALE`. |

Invariants vérifiés par `npm run smoke` : la scène reste épinglée plein écran
pendant toute la marche ; les calques se séparent par profondeur ; le
Chevalier finit au milieu du banc, au milieu de l'écran ; le formulaire est
`inert` et invisible pendant la marche, puis arrive en dégageant le banc ;
s'asseoir se joue en deux temps (lueur, puis particules) ; en mouvement
réduit, le final est sa dernière image ; sur téléphone, le Chevalier est assis,
les plans de profondeur ≥ 0,5 glissent légèrement (`is-drifting`, de
l'ouverture des volets à la fin de la plage, `--drift` × profondeur × largeur
d'écran) puis se posent sur la composition figée, et le formulaire suit dans
le flux.

Les pièges de la pose assise (échelle calée sur le masque, ancrage sur les
hanches), du raccourci `animation` sur les sprites et de `translate` +
`transform` replié par le minifieur restent valables : ils sont commentés dans
`NcHollowScene.vue` et `NcContactPanel.vue`.

---

## 5. Écarts assumés à la spec

Voir **SPEC §14** : le rail horizontal, les 7 scènes et la règle « contenu v1
identique » ont été levés par la révision « Compile → Run ». Toujours valable :
pas de skew cinétique (mesuré à la moitié du budget de frame), et le pointeur
ne pilote aucun décor (seuls le curseur et le CTA magnétique y réagissent).

---

## 6. Ce qui reste à faire

**Contenu à fournir par le propriétaire :**

1. **Le CV n'est plus un fichier à éditer** : `npm run cv` génère
   `public/cv/CV_Nathan_Couton.pdf` (fr) et `CV_Nathan_Couton_EN.pdf` (en)
   depuis `app/data` et les locales, dans la typo et les couleurs du site, et
   échoue si une page déborde. Après toute modification du parcours, des
   compétences ou du hero : relancer, regarder, committer les deux PDF. Le
   site propose celui de la langue affichée (`useResume`).
2. **Démos des projets publics** (captures ou vidéo de 10–20 s ≤ 1,5 Mo +
   poster) : solveur TSP, AJL Peinture, HoloLens, SwalloWin. Les études de cas
   ont leur figure ; un média réel s'ajouterait à côté.
3. **Statut public** : `NOW.openToOffers` (`app/data/now.ts`) est à `false` —
   c'est au propriétaire de dire s'il est « ouvert aux échanges ».
4. **Chiffres sous NDA**, s'il y en a de publiables (volumes, durée des batchs) :
   les études de cas « Intégration des flux » et « Prévoyance » en gagneraient.
5. **Dépôt public du site** : l'étude de cas « Ce portfolio » n'a pas de lien
   vers le code tant que ce n'est pas confirmé.
6. Logo et couleur de Catamania (le logo `public/img/about/job.png` est utilisé
   petit, dans le profil).

**Avant la bascule DNS :** `NUXT_EMAILJS_*` dans Vercel (sinon le formulaire
répond 503), `NUXT_LASTFM_*` (sinon la playlist reste celle de 2024), réencodage de `public/audio/hollow-knight-theme.mp3` (4,4 Mo),
validation de la preview, puis DNS — en gardant les 301.

**Points de vigilance :**

- **Lighthouse performance à 93** en rendu logiciel (98 avant) : le LCP est le
  nom du hero en Fraunces, à 1,4 s ; l'intro de 1,1 s pèse sur le Speed Index.
  À remesurer sur une vraie machine.
- **JS critique 124 kB / 140.** Toute fonctionnalité lourde passe par un
  chargement à la demande, comme ⌘K.
- **La playlist du profil vient de Last.fm** (écoutes Apple Music scrobblées,
  top du mois ; `GET /api/soundtrack`, voir README « Bande-son (Last.fm) ») et
  retombe sur l'instantané Spotify 2024, présenté comme tel, tant que les
  `NUXT_LASTFM_*` ne sont pas renseignés dans Vercel ou que rien n'a été
  scrobblé sur le mois. Apple Music direct a été écarté : MusicKit exige
  l'abonnement payant Apple Developer.
- **L'illustration Greenpath appartient à Team Cherry** : elle reste confinée au
  final, créditée sur la scène et dans le pied de page.

---

## 7. Contexte utile

- **Branche de travail** : `refonte-compile-run`, partie de `main` (la branche
  `claude/serene-albattani-gtubp9` porte l'essai « grotte », écarté).
- **Historique** : un commit par lot, message détaillé expliquant les décisions
  et les corrections. `git log` est une bonne lecture avant de reprendre.
- **Source de contenu** : le site v1 reste la référence pour les textes. Une
  quinzaine de bugs hérités ont été corrigés au passage — ils sont listés en
  annexe B de `SPEC.md` ; ne pas les réintroduire en recopiant v1.
- **Mission Harmonie** : complétée en 2026 à partir de l'entretien annuel
  Catamania (document privé, non versionné). Validé pour publication : Bonita
  et les processus prévoyance / emprunteur / santé, les mises en production
  (santé en mars, premiers flux prévoyance), l'agent IA de revue de code.
  Jamais publié : noms, évaluation, rémunération, projet d'évolution.
