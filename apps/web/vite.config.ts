import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function offlineShell(): Plugin {
  return {
    name: 'smartclass-offline-shell',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((file) => /\.(?:js|css|woff2|svg|webmanifest)$/.test(file))
      const precache = ['/','/manifest.webmanifest', ...assets.map((file) => `/${file}`)]
      const source = `const CACHE_NAME = 'smartclass-buddy-shell-v1';\nconst PRECACHE = ${JSON.stringify(precache)};\nself.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())); });\nself.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });\nself.addEventListener('fetch', (event) => { const request = event.request; if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return; event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok && response.type === 'basic') { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); } return response; }).catch(async () => { if (request.mode === 'navigate') return (await caches.match('/')) || Response.error(); return Response.error(); }))); });\n`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), offlineShell()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})
