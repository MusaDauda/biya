// Biya service worker.
//
// Scope is deliberately narrow: cache the app shell so it opens instantly and
// survives a flaky connection, and nothing else.
//
// This worker MUST NEVER cache a response from Supabase or the services API.
// A payments app that shows a stale balance is worse than one that admits it
// cannot reach the network. There is no offline payment queue and there should
// not be one: you cannot honestly tell someone their money moved while offline.

const VERSION = 'biya-v1'
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Anything that is not our own origin is data: Supabase, the services API,
  // an RPC endpoint, a rate feed. Never touched by the cache.
  if (url.origin !== self.location.origin) return

  // Navigations: try the network so a deployed change is picked up, fall back
  // to the cached shell only when the network is genuinely unavailable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((r) => r ?? Response.error())),
    )
    return
  }

  // Static build assets are content-hashed by Vite, so cache-first is safe.
  if (/\.(js|css|woff2?|png|svg|jpg|jpeg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => hit ?? fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy))
        }
        return res
      })),
    )
  }
})
