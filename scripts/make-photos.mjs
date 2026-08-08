// Builds the landing page's photography from the originals in photos-src/.
//
//   node scripts/make-photos.mjs
//
// The originals are 5184x3456 and 2705x3380, about 6MB of JPEG between them.
// Shipping those as a hero would cost more than the rest of the page put
// together, so only the derivatives below are committed; photos-src/ is
// ignored. Re-run this after replacing an original.
//
// Two crops rather than one, because the hero's shape changes by a factor of
// three between a phone and a desktop: roughly 0.54 wide-to-tall at 375px, and
// 1.68 at 1280px. A single landscape file centre-cropped to a phone throws away
// about two thirds of its width. The portrait original holds the subject and
// the POS stall at both shapes, so it carries the phone, and the landscape
// original carries the desktop where it is barely cropped at all.

import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const OUT = 'public/photos'
mkdirSync(OUT, { recursive: true })

const jobs = [
  // Phones and tablets, up to the 900px breakpoint. 1600 covers a 2x display.
  { src: 'photos-src/hero-portrait.jpg', name: 'hero-portrait', widths: [900, 1600] },
  // Desktop, from 900px up. 2400 covers a 2x display on a large monitor.
  { src: 'photos-src/hero-landscape.jpg', name: 'hero-landscape', widths: [1600, 2400] },
]

for (const job of jobs) {
  for (const width of job.widths) {
    const file = `${OUT}/${job.name}-${width}.webp`
    const info = await sharp(job.src)
      .resize(width, null, { withoutEnlargement: true })
      // Photographs of produce in full sun. Quality below about 70 shows
      // blocking in the reds, which is most of both frames.
      .webp({ quality: 76, effort: 5 })
      .toFile(file)
    console.log(`${file.padEnd(40)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`)
  }
}
