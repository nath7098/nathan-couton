/**
 * Cuts the cave painting into the parallax layers the contact scene flies
 * through.
 *
 *   node scripts/build-cave-layers.mjs
 *
 * ── the source ───────────────────────────────────────────────────────────────
 * `cave-source.webp` is a 1672×941 sheet: five previews of the same painting
 * stacked with white rules between them, four of them showing one group of
 * elements and the fifth showing the lot composited. Only the fifth is a whole
 * frame — cross-correlating the other four against it finds their best
 * horizontal shifts at -2, 15, 47 and 14 px, which is to say they were rendered
 * separately and were never registered with each other. Stacking them as layers
 * would put every stalactite a few pixels off from its own shadow.
 *
 * So the composite is the source, and the four preview strips are what they
 * were drawn to be: the painter saying which element belongs at which depth.
 * Cutting one image guarantees the layers line up, because they are the same
 * pixels.
 *
 * ── the cuts ─────────────────────────────────────────────────────────────────
 * Every boundary below is measured off the painting rather than chosen. The
 * numbers that matter are in CUTS, with the measurement that produced each one.
 *
 * Two rules decide which layer a thing lands in:
 *
 *   - Nothing appears sharp in two layers. A silhouette split across two depths
 *     reads as a double image the moment the camera moves — which is how the
 *     lamp posts looked on the first pass, walking along the floor beside
 *     themselves.
 *   - A fixture travels at the speed of whatever holds it up. A post stands on
 *     the floor and a lantern hangs off the roof, so they go to those depths
 *     even though they are the same kind of thing and were drawn on the same
 *     preview strip. They still get their own layers, so the light can pulse on
 *     a schedule of its own.
 *
 * The soft layers are blurred premultiplied — colour and coverage through the
 * same kernel — so a glow carries its own diffuse light rather than a blurred
 * window onto the sharp painting underneath it. That was the second thing that
 * ghosted: `glow` had a soft alpha over hard art, and every post showed through
 * it with its outline intact.
 *
 * Like the other asset scripts this is deliberately not part of the build, and
 * the generated webp/avif are committed. Idempotent: same input, same bytes.
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SRC = 'public/img/parallax/cave-source.webp'
const OUT = 'public/img/parallax'

/**
 * Where the painting's own numbers live.
 *
 * Kept in one block because `app/data/parallax.ts` has to agree with them: the
 * plate size, the depths and the ground line are the same facts on both sides,
 * and the unit tests check they have not drifted apart.
 */
export const CUTS = {
  /**
   * The white rules between the five preview strips: a row counts as a rule
   * when three quarters of it is brighter than 200 in every channel. The first
   * threshold tried (225 over 90% of the row) found four of them and merged two
   * strips; these bounds find all four rules.
   */
  ruleLevel: 200,
  ruleShare: 0.75,
  /** The composite is the last strip. Its first row is the rule's own fringe. */
  skipTop: 1,

  /**
   * The caption burnt into the composite's top-left corner.
   *
   * It is grey, and it is the only achromatic thing in a painting made entirely
   * of warm light, so the mask is a saturation test rather than a rectangle and
   * the lit stalactite tips it lies among survive it. Confined to its own
   * corner all the same, so a lantern's white-hot core cannot be caught by it.
   */
  caption: { x1: 430, y0: 10, y1: 42, level: 90, flatness: 0.18, grow: 3 },

  /**
   * The pillars, as x windows.
   *
   * Found, not eyeballed: between the roof and the floor (y 130..208) the only
   * dark masses are the pillars, and a run-length pass over the columns that
   * are more than 40% dark through that band returns exactly these four. Two of
   * them are halves of pillars the painting cuts off at its edges; they belong
   * to this layer all the same, and a mirrored join puts them back together.
   */
  pillars: [[0, 74], [130, 273], [1383, 1524], [1602, 1671]],
  pillarCut: [46, 118],

  /**
   * The roof: dark, high up, and fading out where the rock gives way to air.
   *
   * The row darkness profile runs 98% dark at the top edge down to 7% by y 150,
   * so the fade brackets the crossing rather than cutting at a single row.
   */
  roofLevel: 62,
  roofFade: [104, 168],
  /**
   * How far the roof reaches past its own darkness, and how bright a pixel may
   * be and still count as rock rather than air. The lit rims run to about 150;
   * the air between the teeth is brighter than that wherever it is lit at all.
   */
  roofRim: 168,
  roofReach: 7,

  /**
   * The far roof is the same silhouette squashed towards the ceiling and slid
   * sideways. A connected-component pass over the roof finds one mass of
   * 100k px and a scatter of 21 crumbs — it is one continuous sheet of rock,
   * and there is no honest way to split it into near and far teeth. Shorter
   * teeth, further along, dimmed into the air is how the game builds its own
   * second row, and it is why the two layers do not read as one image drawn
   * twice.
   */
  farSquash: 0.58,
  farSlide: 137,

  /**
   * The fixtures' white-hot cores.
   *
   * 218 is not a taste call. Below it, every lantern joins the bright column of
   * air beneath it and the two run together into a single mass 165 rows tall,
   * lantern and post and all; at 218 nothing spans more than 90 rows and the
   * fixtures come apart cleanly. A mass then counts as standing if it reaches
   * the rock, or if it is a narrow vertical bar in the lower half — the dimmer
   * posts break into two or three pieces on the way down and only the lowest
   * touches the floor.
   */
  coreLevel: [218, 242],
  groundY: 214,
  standingWidth: 14,
  standingFrom: 150,
  /**
   * Classifying at 218 and cutting at 218 are not the same job. The core is
   * only the hottest part of a fixture — a post's bar reads at about 200 and
   * its outline is darker than the rock — so cutting there left the posts as
   * hairlines and dropped their bodies into the blurred `glow`, where they
   * travelled at a third of the floor's speed. The body is instead grown out
   * from the classified core, `bodyReach` steps through anything brighter than
   * `bodyGate`, plus a short unconditional dilation that picks up the dark
   * contour the artist drew around each fixture.
   */
  bodyGate: 150,
  bodyReach: [60, 14],
  bodyCost: [20, 1],
  bodyEdge: 3,

  /**
   * The floor. The row darkness profile jumps from 11% to 64% across y 204..233,
   * which is the rock coming up; it owns the plate outright below that.
   */
  ground: [204, 233],
  /** The lip of rock nearest the camera. */
  front: [240, 266],
  /**
   * How far the backdrop is blurred once it has been filled in.
   *
   * Enough to soften the seams the fill leaves and to read as distance, not so
   * much that the cavern behind the Knight turns to fog. Most of it is covered
   * by the layers in front at rest; what shows is what slides out from behind
   * them.
   */
  backBlur: 3,
  /** Where feet and bench legs land, in rows from the plate's top edge. */
  groundLine: 222,

  /**
   * Rows of its own edge added above and below every plate.
   *
   * The painting is a 5.9∶1 panorama and the scene covers the viewport by
   * height, so at its native 284 rows it lands magnified about 3.2× on a
   * 900px-tall screen — sharp enough, but only a third of the painting is on
   * screen at once and the soft layers turn to mush at that scale. The top row
   * of the plate averages 9/255 and the bottom twenty are flat black, so
   * padding with copies of them adds nothing anyone can see and costs nothing
   * to encode: it is the same rendered pixels either way, only read from a
   * taller texture. At 384 rows the magnification drops to 2.3× and half a
   * plate more of the painting is in frame.
   *
   * Symmetric, so every landmark keeps its offset from the plate's centre line
   * and GROUND_LINE does not move.
   */
  pad: 50,
}

/** The plate's height once padded — what `app/data/parallax.ts` declares. */
export const PLATE_HEIGHT = 284 + 2 * CUTS.pad

/** Smoothstep. */
const step = (v, a, b) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Pulls the composite strip out of the sheet and takes the caption off it.
 *
 * The caption is filled by interpolating down each column between the nearest
 * clean pixel above and below. The roof it lies on is a vertical gradient, so a
 * vertical fill reproduces it exactly — where the diffusion fill tried first
 * left a grey ghost of the sentence, because averaging in from all four sides
 * pulls a dark hole towards its brighter edges.
 */
export async function loadPlate(src = SRC) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H0, channels: C } = info

  const rules = []
  for (let y = 0; y < H0; y++) {
    let pale = 0
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      if (data[i] > CUTS.ruleLevel && data[i + 1] > CUTS.ruleLevel && data[i + 2] > CUTS.ruleLevel) pale++
    }
    if (pale / W >= CUTS.ruleShare) rules.push(y)
  }
  const top = (rules.length ? rules[rules.length - 1] : -1) + 1 + CUTS.skipTop
  const H = H0 - top

  const px = Buffer.alloc(W * H * 3)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const s = ((y + top) * W + x) * C, d = (y * W + x) * 3
      for (let c = 0; c < 3; c++) px[d + c] = data[s + c]
    }

  const { x1, y0, y1, level, flatness, grow } = CUTS.caption
  const mask = new Uint8Array(W * H)
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < x1; x++) {
      const i = (y * W + x) * 3
      const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2])
      if (mx >= level && (mx ? (mx - mn) / mx : 0) < flatness) mask[y * W + x] = 1
    }
  for (let pass = 0; pass < grow; pass++) { // take the antialiased fringe too
    const grown = Uint8Array.from(mask)
    for (let y = y0; y < y1; y++)
      for (let x = 0; x < x1; x++) {
        const k = y * W + x
        if (!mask[k] && (mask[k - 1] || mask[k + 1] || mask[k - W] || mask[k + W])) grown[k] = 1
      }
    mask.set(grown)
  }
  let filled = 0
  for (let x = 0; x < x1; x++)
    for (let y = y0; y < y1; y++) {
      if (!mask[y * W + x]) continue
      let a = y - 1
      while (a >= 0 && mask[a * W + x]) a--
      let b = y + 1
      while (b < H && mask[b * W + x]) b++
      const i = (y * W + x) * 3
      for (let c = 0; c < 3; c++) {
        const va = a >= 0 ? px[(a * W + x) * 3 + c] : null
        const vb = b < H ? px[(b * W + x) * 3 + c] : null
        px[i + c] = va == null
          ? vb
          : vb == null
            ? va
            : Math.round(va + (vb - va) * ((y - a) / (b - a)))
      }
      filled++
    }

  return { px, W, H, rules, filled }
}

/**
 * The layers, back to front — this array is the paint order, and its depths are
 * the ones `app/data/parallax.ts` declares.
 *
 * `lamps` sits at the floor's depth and `lanterns` at the roof's, deliberately:
 * a layer at a depth another layer already occupies is just a slot in the paint
 * order, and it costs nothing but buys each set of fixtures an animation of its
 * own.
 */
export const LAYERS = [
  { file: 'cave-back', depth: 0.10 },
  { file: 'cave-roof-far', depth: 0.48 },
  { file: 'cave-pillars', depth: 0.66 },
  { file: 'cave-ground', depth: 1.00 },
  { file: 'cave-lamps', depth: 1.00, motion: 'glow' },
  { file: 'cave-roof', depth: 1.55 },
  { file: 'cave-lanterns', depth: 1.55, motion: 'float' },
  { file: 'cave-front', depth: 1.90 },
]

/**
 * Separable box blur over a single channel, `n` passes.
 *
 * The radii are separate because the light in this painting is not isotropic:
 * it falls in vertical shafts between the stalactites, and a round kernel wide
 * enough to soften them into a wash also wipes them out. Blurring along a shaft
 * and barely across it keeps them.
 */
function blur(src, W, H, r, n = 3, ry = r) {
  let a = Float32Array.from(src), b = new Float32Array(W * H)
  const clampX = x => Math.min(W - 1, Math.max(0, x))
  const clampY = y => Math.min(H - 1, Math.max(0, y))
  for (let pass = 0; pass < n; pass++) {
    for (let y = 0; y < H; y++) {
      let acc = 0
      for (let x = -r; x <= r; x++) acc += a[y * W + clampX(x)]
      for (let x = 0; x < W; x++) {
        b[y * W + x] = acc / (2 * r + 1)
        acc += a[y * W + clampX(x + r + 1)] - a[y * W + clampX(x - r)]
      }
    }
    ;[a, b] = [b, a]
    for (let x = 0; x < W; x++) {
      let acc = 0
      for (let y = -ry; y <= ry; y++) acc += a[clampY(y) * W + x]
      for (let y = 0; y < H; y++) {
        b[y * W + x] = acc / (2 * ry + 1)
        acc += a[clampY(y + ry + 1) * W + x] - a[clampY(y - ry) * W + x]
      }
    }
    ;[a, b] = [b, a]
  }
  return a
}

/**
 * Blurs a masked cut-out without letting the sharp painting show through it.
 *
 * Coverage and colour go through the same kernel, the colour premultiplied by
 * the coverage and divided back out afterwards. Blurring only the coverage — the
 * obvious thing, and what the first pass did — leaves every edge in the source
 * art visible at reduced opacity, so a layer meant to be a wash of light came
 * out as a blurred window onto hard-edged lamp posts.
 */
function soften(mask, px, W, H, r, n = 3, ry = r) {
  const pm = [0, 1, 2].map((c) => {
    const t = new Float32Array(W * H)
    for (let k = 0; k < W * H; k++) t[k] = mask[k] * px[k * 3 + c]
    return blur(t, W, H, r, n, ry)
  })
  const a = blur(mask, W, H, r, n, ry)
  return { a, rgb: k => (a[k] > 1e-4 ? [pm[0][k] / a[k], pm[1][k] / a[k], pm[2][k] / a[k]] : [0, 0, 0]) }
}

/**
 * Grows `seed` outwards through `gate`, up to a budget of `reach`.
 *
 * A step costs `cost[0]` sideways and `cost[1]` up or down, which is the whole
 * point of writing this rather than a plain flood fill. An unweighted
 * four-connected fill spreads as a diamond, and a lamp post needs a budget of
 * sixty rows to be picked up whole — so wherever its drawn outline had a gap,
 * the fill escaped into the lit air around it and kept going, and the cavern
 * came out with a row of pale sixty-pixel diamonds standing in it, their edges
 * at a perfect forty-five degrees. Charging eight for a sideways step and one
 * for a vertical one lets the growth run the length of a post while never
 * leaving its width.
 *
 * The first `edge` of the budget ignores the gate, so the growth always picks
 * up the dark contour drawn around a lit shape before the gate holds it back.
 *
 * Computed as a chamfer distance: four raster sweeps, alternating direction,
 * which is exact for an open field and close enough around the obstacles a
 * gate makes.
 */
function grow(seed, W, H, reach, gate, cost = [1, 1], edge = 0) {
  const INF = 1e9
  const dist = new Float32Array(W * H).fill(INF)
  for (let k = 0; k < W * H; k++) if (seed[k] > 0.5) dist[k] = 0
  const relax = (k, from, step) => {
    const d = dist[from] + step
    if (d >= dist[k] || d > reach) return
    if (d > edge && !gate[k]) return
    dist[k] = d
  }
  for (let pass = 0; pass < 4; pass++) {
    const forward = pass % 2 === 0
    for (let i = 0; i < H; i++) {
      const y = forward ? i : H - 1 - i
      for (let j = 0; j < W; j++) {
        const x = forward ? j : W - 1 - j
        const k = y * W + x
        if (x > 0) relax(k, k - 1, cost[0])
        if (x < W - 1) relax(k, k + 1, cost[0])
        if (y > 0) relax(k, k - W, cost[1])
        if (y < H - 1) relax(k, k + W, cost[1])
      }
    }
  }
  const out = new Float32Array(W * H)
  for (let k = 0; k < W * H; k++) if (dist[k] <= reach) out[k] = 1
  return out
}

/** Builds every layer as raw RGBA, keyed by file name. */
export function cutLayers({ px, W, H }) {
  const lum = k => 0.2126 * px[k * 3] + 0.7152 * px[k * 3 + 1] + 0.0722 * px[k * 3 + 2]
  const at = k => [px[k * 3], px[k * 3 + 1], px[k * 3 + 2]]
  const out = {}
  const emit = (file, fn) => {
    const buf = Buffer.alloc(W * H * 4)
    for (let k = 0; k < W * H; k++) {
      const [r, g, b, a] = fn(k % W, (k / W) | 0, k)
      buf[k * 4] = Math.max(0, Math.min(255, r))
      buf[k * 4 + 1] = Math.max(0, Math.min(255, g))
      buf[k * 4 + 2] = Math.max(0, Math.min(255, b))
      buf[k * 4 + 3] = Math.max(0, Math.min(255, a * 255))
    }
    out[file] = buf
  }
  /** Source-over: a sharp core laid on its own soft halo. */
  const over = (ca, cc, ha, hc) => {
    const a = ca + ha * (1 - ca)
    if (a <= 1e-4) return [0, 0, 0, 0]
    return [0, 1, 2].map(i => (cc[i] * ca + hc[i] * ha * (1 - ca)) / a).concat(a)
  }

  const inPillar = new Uint8Array(W)
  for (const [a, b] of CUTS.pillars) for (let x = a; x <= b; x++) inPillar[x] = 1

  // ── the roof ──────────────────────────────────────────────────────────────
  // A darkness cut finds the rock but stops at its own outline: every
  // stalactite in this painting is rimmed in lit orange, far too bright to pass
  // a darkness test, so the first version handed all those rims to `glow` and
  // the roof came back with its edges smeared. The cut is grown out through
  // anything that is not open air, which puts each rim back on the tooth it
  // belongs to.
  const roof = new Float32Array(W * H)
  {
    const seed = new Float32Array(W * H)
    const gate = new Uint8Array(W * H)
    for (let y = 0; y < CUTS.roofFade[1]; y++)
      for (let x = 0; x < W; x++) {
        if (inPillar[x]) continue // this column's roof belongs to the pillar
        const k = y * W + x
        if (lum(k) < CUTS.roofLevel) seed[k] = 1
        if (lum(k) < CUTS.roofRim) gate[k] = 1
      }
    const body = grow(seed, W, H, CUTS.roofReach, gate)
    const soft = blur(body, W, H, 1, 1)
    for (let y = 0; y < CUTS.roofFade[1]; y++)
      for (let x = 0; x < W; x++) {
        const k = y * W + x
        roof[k] = soft[k] * (1 - step(y, CUTS.roofFade[0], CUTS.roofFade[1]))
      }
  }

  // roof-far — the second row of teeth (see CUTS.farSquash).
  {
    const m = new Float32Array(W * H)
    const warped = Buffer.alloc(W * H * 3)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const sy = y / CUTS.farSquash
        if (sy >= H - 1) continue
        const sx = (x + CUTS.farSlide) % W, y0 = Math.floor(sy), f = sy - y0
        const k = y * W + x, ka = y0 * W + sx, kb = (y0 + 1) * W + sx
        m[k] = roof[ka] * (1 - f) + roof[kb] * f
        for (let c = 0; c < 3; c++) warped[k * 3 + c] = px[ka * 3 + c] * (1 - f) + px[kb * 3 + c] * f
      }
    const { a, rgb } = soften(m, warped, W, H, 4, 3)
    emit('cave-roof-far', (x, y, k) => {
      const c = rgb(k)
      // Darkened and held translucent, never lifted. Mixing distance *towards*
      // a lighter air colour — the obvious way to fade a silhouette — makes a
      // layer that is brighter than the dark roof it hangs behind, and at this
      // magnification its teeth came back as pale chevrons floating in the
      // middle of the cavern. Distant rock takes light away; it does not add
      // any.
      return [c[0] * 0.62, c[1] * 0.64, c[2] * 0.72, Math.min(0.62, a[k] * 0.9)]
    })
  }

  // pillars — the stone columns, cut out of their own x windows top to bottom.
  // Inside a window the only bright thing is the air behind, so the silhouette
  // is a luminance cut; the roof above each window belongs here rather than to
  // `roof`, which is why `roof` skipped these columns.
  {
    const m = new Float32Array(W * H)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (inPillar[x]) m[y * W + x] = 1 - step(lum(y * W + x), CUTS.pillarCut[0], CUTS.pillarCut[1])
    const a = blur(m, W, H, 1, 1)
    emit('cave-pillars', (x, y, k) => [...at(k), Math.min(1, a[k] * 1.15)])
  }

  // ── the fixtures ──────────────────────────────────────────────────────────
  const fixture = new Float32Array(W * H)
  {
    const core = new Float32Array(W * H)
    for (let k = 0; k < W * H; k++) core[k] = step(lum(k), CUTS.coreLevel[0], CUTS.coreLevel[1])

    const label = new Int32Array(W * H).fill(-1)
    const box = []
    const stack = new Int32Array(W * H)
    for (let seed = 0; seed < W * H; seed++) {
      if (label[seed] >= 0 || core[seed] <= 0.5) continue
      const id = box.length
      box.push({ x0: W, x1: -1, y1: -1 })
      let sp = 0
      stack[sp++] = seed
      label[seed] = id
      while (sp) {
        const k = stack[--sp], x = k % W, y = (k / W) | 0, m = box[id]
        if (x < m.x0) m.x0 = x
        if (x > m.x1) m.x1 = x
        if (y > m.y1) m.y1 = y
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
          const n = ny * W + nx
          if (label[n] >= 0 || core[n] <= 0.5) continue
          label[n] = id
          stack[sp++] = n
        }
      }
    }
    const standing = box.map(m =>
      m.y1 >= CUTS.groundY - 18 || (m.x1 - m.x0 <= CUTS.standingWidth && m.y1 >= CUTS.standingFrom))
    out._fixtures = { total: box.length, standing: standing.filter(Boolean).length }

    const gate = new Uint8Array(W * H)
    for (let k = 0; k < W * H; k++) gate[k] = lum(k) > CUTS.bodyGate ? 1 : 0

    for (const [file, wantStanding, r] of [['cave-lamps', true, 3], ['cave-lanterns', false, 4]]) {
      const seed = new Float32Array(W * H)
      for (let k = 0; k < W * H; k++) {
        const l = label[k]
        if (l >= 0 ? standing[l] === wantStanding : false) seed[k] = core[k] > 0.5 ? 1 : 0
      }
      const body = grow(seed, W, H, CUTS.bodyReach[wantStanding ? 0 : 1], gate, CUTS.bodyCost, CUTS.bodyEdge)
      for (let k = 0; k < W * H; k++) fixture[k] = Math.max(fixture[k], body[k])
      // The gate-constrained growth leaves a comb along the edges it stopped
      // at; two passes take the teeth off without losing the fixture's outline.
      const edge = blur(body, W, H, 2, 2)
      const halo = soften(body, px, W, H, r, 5)
      emit(file, (x, y, k) => {
        const c = at(k)
        // The halo's alpha is raised to a power before it is used. A box blur,
        // however many passes, ends at a hard radius, and a wide one around a
        // bright fixture painted a pyramid of light with a visible straight
        // edge — at this magnification the cavern grew a row of pale chevrons.
        // The exponent bends the tail down so it reaches nothing smoothly.
        const [r2, g2, b2, a] = over(Math.min(1, edge[k] * 1.5),
          [Math.min(255, c[0] + 18), Math.min(255, c[1] + 9), c[2]],
          Math.min(1, halo.a[k] ** 1.7 * 1.2), halo.rgb(k))
        return [r2, g2, b2, a]
      })
    }
  }

  // ground — the floor the Knight walks on.
  emit('cave-ground', (x, y, k) => [...at(k), step(y, CUTS.ground[0], CUTS.ground[1])])

  // roof — the rock overhead, at full contrast.
  emit('cave-roof', (x, y, k) => {
    const c = at(k)
    return [c[0] * 0.94, c[1] * 0.94, c[2] * 0.97, Math.min(1, roof[k] * 1.12)]
  })

  // front — the lip of rock nearest the camera, flattened to a silhouette. It
  // is the same rock as `ground` and travels faster, which would read as a
  // double image if it kept its detail; as a near-black shape it reads as what
  // it is, the edge of the floor passing in front of the lens.
  emit('cave-front', (x, y, k) => {
    const c = at(k)
    return [c[0] * 0.20, c[1] * 0.20, c[2] * 0.26, step(y, CUTS.front[0], CUTS.front[1])]
  })

  // ── the backdrop ──────────────────────────────────────────────────────────
  // The painting with everything the layers above took out of it filled back
  // in from its surroundings, lightly blurred, and dimmed. It is the backstop:
  // opaque, the same size as the rest, and the only layer with no holes.
  //
  // Two earlier versions of this are worth not going back to. Blurring the
  // whole painting and dimming it draws every lit thing in the cavern twice,
  // once soft underneath and once sharp on top, and at the magnification this
  // scene runs at the result is milky. Solving for the backdrop instead —
  // compositing the front layers and taking `(source − front·α)/(1 − α)` —
  // reproduces the painting exactly at rest, but only at rest: every bright
  // thing in front leaves a dark hole behind it, the two drift apart the moment
  // the scene moves, and where the subtraction clips a channel to zero the hole
  // comes out blue.
  //
  // Filling is neither. Nothing is counted twice because the elements are gone,
  // and nothing can go negative because no arithmetic crosses zero — the fill
  // only ever copies neighbouring paint inwards, the way the caption was taken
  // off the plate at the top of this file.
  {
    const back = Buffer.from(px)
    const copy = (dst, src) => {
      for (let c = 0; c < 3; c++) back[dst * 3 + c] = px[src * 3 + c]
    }

    // The roof, from below: each column continues upward with the air just
    // under the rock, so the ceiling opens out instead of leaving a hole.
    for (let x = 0; x < W; x++) {
      let t = 0
      while (t < H - 1 && roof[t * W + x] > 0.3) t++
      for (let y = 0; y < t; y++) copy(y * W + x, (t + 2 < H ? t + 2 : t) * W + x)
    }
    // The floor, from above, by the same rule.
    for (let x = 0; x < W; x++) {
      const b0 = Math.max(0, CUTS.ground[0] - 3)
      for (let y = b0; y < H; y++) copy(y * W + x, b0 * W + x)
    }
    // The pillars, across: each window is closed by running its two edge
    // columns into each other. The two at the plate's edges have only one side
    // to borrow from, so they borrow it twice.
    for (const [x0, x1] of CUTS.pillars) {
      const left = x0 - 1, right = x1 + 1
      for (let y = 0; y < H; y++)
        for (let x = x0; x <= x1; x++) {
          const k = y * W + x
          const f = (x - x0 + 1) / (x1 - x0 + 2)
          for (let c = 0; c < 3; c++) {
            const a = left >= 0 ? px[(y * W + left) * 3 + c] : px[(y * W + right) * 3 + c]
            const bb = right < W ? px[(y * W + right) * 3 + c] : px[(y * W + left) * 3 + c]
            back[k * 3 + c] = a + (bb - a) * f
          }
        }
    }
    // The fixtures are small and stay where they are, pulled down towards the
    // air around them: a post's own light belongs to the cavern as much as to
    // the post, and taking it out entirely leaves the backdrop unlit.
    for (let k = 0; k < W * H; k++) {
      if (fixture[k] <= 0) continue
      for (let c = 0; c < 3; c++) back[k * 3 + c] = back[k * 3 + c] * (1 - 0.45 * fixture[k])
    }

    const ch = [0, 1, 2].map(c => blur(
      Float32Array.from({ length: W * H }, (_, k) => back[k * 3 + c]), W, H, CUTS.backBlur, 3))
    emit('cave-back', (x, y, k) => [ch[0][k] * 0.94, ch[1][k] * 0.95, ch[2][k] * 1.0, 1])
  }

  return out
}

/**
 * Adds `CUTS.pad` rows above and below a plate.
 *
 * Transparent for the cut-out layers — there is nothing of them up there. For
 * `cave-back`, which is the backstop and has to stay opaque from the top of
 * the screen to the bottom, the padding fades its edge row into black: above
 * the cavern's roof and below its floor there is nothing but more rock, and
 * that is what solid black reads as. Replicating the edge row instead puts
 * whatever colour that row happens to carry across the top of the screen —
 * and because the backdrop fills the roof in with the air behind it, that
 * colour is a lit brown, so the cavern came with a smear of daylight over it.
 */
export function padLayer(buf, W, H, opaque) {
  const pad = CUTS.pad
  const out = Buffer.alloc(W * (H + 2 * pad) * 4)
  buf.copy(out, W * pad * 4)
  if (!opaque) return out
  for (let y = 0; y < pad; y++) {
    const fade = 1 - (y + 1) / pad
    for (let x = 0; x < W; x++) {
      for (const [dst, src] of [[y, 0], [H + pad + y, H - 1]]) {
        const d = (dst * W + x) * 4, s0 = (src * W + x) * 4
        for (let c = 0; c < 3; c++) out[d + c] = buf[s0 + c] * (dst < pad ? fade : 1 - fade)
        out[d + 3] = 255
      }
    }
  }
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const plate = await loadPlate()
  console.log(`plate ${plate.W}×${plate.H} (+${CUTS.pad} pad) from ${SRC} (${plate.rules.length} rules, ${plate.filled} caption px filled)`)
  const layers = cutLayers(plate)
  console.log(`fixtures: ${layers._fixtures.total} masses, ${layers._fixtures.standing} standing`)
  mkdirSync(OUT, { recursive: true })
  const raw = { width: plate.W, height: plate.H + 2 * CUTS.pad, channels: 4 }
  let total = 0
  for (const { file } of LAYERS) {
    const img = sharp(padLayer(layers[file], plate.W, plate.H, file === 'cave-back'), { raw })
    const w = await img.clone().webp({ quality: 82, effort: 6 }).toFile(`${OUT}/${file}.webp`)
    const a = await img.clone().avif({ quality: 52, effort: 7 }).toFile(`${OUT}/${file}.avif`)
    total += a.size
    console.log(`  ${file.padEnd(16)} webp ${String(Math.round(w.size / 1024)).padStart(4)} KB   avif ${String(Math.round(a.size / 1024)).padStart(4)} KB`)
  }
  console.log(`  ${'total (avif)'.padEnd(16)}                 ${Math.round(total / 1024)} KB`)
}
