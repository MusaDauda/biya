// Rebuilds the Biya icon set from the brand mark.
//
//   node scripts/make-icons.mjs
//
// The previous version of this script keyed a grey checkerboard out of a JPEG
// that had been saved as .png, because the only copy of the old marigold logo
// was a flattened raster. That logo is retired. The seal is vector now, defined
// once here and matching primitives.tsx exactly, so an icon can never drift
// away from the mark the app draws on screen.
//
// Brand system, app icon: drawn full bleed on the indigo field, with the
// departure dot clear of the edge so every platform mask misses it.

import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

// --- the mark, in its native 48 unit box -----------------------------------
// Identical to SEAL_OPEN / SEAL_CLOSED in src/app/components/biya/primitives.tsx.
const SEAL_OPEN =
  'M13 8h7a8 8 0 0 1 0 16 8 8 0 0 1 0 16h-7a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7zm7 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7zm0 16a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7z'
const SEAL_CLOSED =
  'M13 8h7a8 8 0 0 1 0 16 8 8 0 0 1 0 16h-7a7 7 0 0 1-7-7V15a7 7 0 0 1 7-7z'

const INDIGO = '#4844E0'
const WHITE = '#FFFFFF'

// Measured bounds of the artwork inside the 48 unit box. The seal spans x 6..28,
// the departure dot x 31.5..43.5, both y 8..40 (dot y 18..30). Centring on the
// drawn bounds rather than on the box keeps the mark optically centred: the box
// has empty space to the right of the dot that would otherwise pull it left.
const OPEN_BOX = { x: 6, y: 8, w: 37.5, h: 32 }
const CLOSED_BOX = { x: 6, y: 8, w: 22, h: 32 }

/**
 * @param closed  Below 24px the counters fill in and the dot is noise, so small
 *                sizes get the solid monogram. This is the brand's own floor.
 * @param cover   Fraction of the canvas the artwork spans. Maskable icons need
 *                a deep safe zone because launchers crop to a circle.
 */
function markSvg(size, { closed = false, cover = 0.74, background = null } = {}) {
  const box = closed ? CLOSED_BOX : OPEN_BOX
  const scale = (48 * cover) / Math.max(box.w, box.h)
  const tx = 24 - (box.x + box.w / 2) * scale
  const ty = 24 - (box.y + box.h / 2) * scale

  const bg = background ? `<rect width="48" height="48" fill="${background}"/>` : ''
  const dot = closed ? '' : `<circle cx="37.5" cy="24" r="6" fill="${WHITE}"/>`

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">` +
      bg +
      `<g transform="translate(${tx} ${ty}) scale(${scale})">` +
      `<path d="${closed ? SEAL_CLOSED : SEAL_OPEN}" fill="${WHITE}" fill-rule="evenodd" clip-rule="evenodd"/>` +
      dot +
      '</g></svg>',
  )
}

async function png(svg, size) {
  return sharp(svg, { density: 384 }).resize(size, size).png().toBuffer()
}

const targets = [
  // path, size, options
  ['public/icon-192.png', 192, { cover: 0.74, background: INDIGO }],
  ['public/icon-512.png', 512, { cover: 0.74, background: INDIGO }],
  // Launchers crop maskable icons to a circle or squircle and keep only the
  // middle ~80%. Pulling the artwork in to 56% keeps the departure dot inside
  // that circle instead of letting the mask bite it off.
  ['public/icon-maskable-512.png', 512, { cover: 0.56, background: INDIGO }],
  ['public/apple-touch-icon.png', 180, { cover: 0.72, background: INDIGO }],
  // Favicons carry the indigo tile rather than a transparent ground. A
  // transparent favicon with an ink glyph disappears against a dark browser
  // tab, which is where most of these are actually seen.
  ['public/favicon.png', 64, { cover: 0.72, background: INDIGO }],
  ['public/favicon-32.png', 32, { cover: 0.72, background: INDIGO }],
  ['public/favicon-16.png', 16, { closed: true, cover: 0.68, background: INDIGO }],
]

for (const [path, size, opts] of targets) {
  writeFileSync(path, await png(markSvg(size, opts), size))
  console.log(`${path.padEnd(30)} ${size}x${size}${opts.closed ? '  monogram' : ''}`)
}

// A vector favicon so the tab icon stays sharp on any display. Browsers that
// support it prefer it over every PNG above.
writeFileSync('public/favicon.svg', markSvg(48, { cover: 0.72, background: INDIGO }))
console.log('public/favicon.svg             vector')

// The full lockup, for anywhere that wants the mark on its own.
writeFileSync('public/mark.png', await png(markSvg(512, { cover: 0.92 }), 512))
console.log('public/mark.png                512x512 glyph only, transparent')
