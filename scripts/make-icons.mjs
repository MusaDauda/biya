// Rebuilds the Biya icon set.
//
// The source logo shipped as a JPEG named .png, so its transparency had already
// been flattened onto a grey checkerboard and those squares were real pixels.
// The Biya mark is gold and highly saturated; the checkerboard is pure grey with
// zero chroma. So we key on chroma rather than on colour distance, which keeps
// the anti-aliased edges of the mark intact.
//
//   node scripts/make-icons.mjs

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'

// Read into a buffer rather than handing sharp a path: on Windows sharp keeps
// the source file handle open, and we write back over this same file.
const SRC = readFileSync('public/logo.png')
const INK = { r: 0, g: 2, b: 24, alpha: 1 }   // biya.ink #000218

// Chroma below LOW is certainly background, above HIGH is certainly the mark.
// Between them we ramp alpha so edges stay smooth.
const LOW = 12
const HIGH = 40

async function keyOutGrey(src) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.from(data)
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2]
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    let a = 255
    if (chroma <= LOW) a = 0
    else if (chroma < HIGH) a = Math.round(((chroma - LOW) / (HIGH - LOW)) * 255)
    out[i + 3] = a
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
}

// The wordmark sits under the shield with a clear gap. At 192px a wordmark is
// illegible, so app icons use the shield alone.
async function topMark(transparentPng) {
  const trimmed = await sharp(transparentPng).trim().png().toBuffer()
  const { width, height } = await sharp(trimmed).metadata()
  return sharp(trimmed)
    .extract({ left: 0, top: 0, width, height: Math.round(height * 0.58) })
    .trim()
    .png()
    .toBuffer()
}

// `pad` is the fraction of the canvas left empty around the mark. Maskable
// icons need a generous safe zone because launchers crop to a circle or squircle.
async function icon(mark, size, pad, background) {
  const inner = Math.round(size * (1 - pad * 2))
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer()
}

const transparent = await keyOutGrey(SRC)
writeFileSync('public/logo.png', transparent)
console.log('public/logo.png            rewritten with real transparency')

const mark = await topMark(transparent)
writeFileSync('public/mark.png', mark)
const markMeta = await sharp(mark).metadata()
console.log(`public/mark.png            ${markMeta.width}x${markMeta.height} shield only`)

const targets = [
  ['public/icon-192.png',          192, 0.16, INK],
  ['public/icon-512.png',          512, 0.16, INK],
  ['public/icon-maskable-512.png', 512, 0.26, INK],
  ['public/apple-touch-icon.png',  180, 0.14, INK],
  ['public/favicon.png',            64, 0.08, { r: 0, g: 0, b: 0, alpha: 0 }],
]

for (const [path, size, pad, bg] of targets) {
  writeFileSync(path, await icon(mark, size, pad, bg))
  console.log(`${path.padEnd(26)} ${size}x${size}`)
}
