import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function offlineShell(): Plugin {
  return {
    name: 'smartclass-offline-shell',
    apply: 'build',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((file) => /\.(?:js|css|woff2|svg|webmanifest|png)$/.test(file))
      const precache = ['/', '/manifest.webmanifest', '/favicon.png', ...assets.map((file) => `/${file}`)]
      
      // Subject lab HTML files and their assets that need to be cached
      const subjectPaths = [
        '/subjects/physics/index.html',
        '/subjects/chemistry/index.html',
        '/subjects/mathematics/index.html',
        '/subjects/biology/index.html',
      ]
      
      const allPrecache = [...new Set([...precache, ...subjectPaths])]
      
      const source = `const CACHE_NAME = 'smartclass-buddy-shell-v2';\nconst SUBJECT_CACHE = 'smartclass-subjects-v2';\nconst PRECACHE = ${JSON.stringify(allPrecache)};\n\nself.addEventListener('install', (event) => {\n  event.waitUntil(\n    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())\n  );\n});\n\nself.addEventListener('activate', (event) => {\n  event.waitUntil(\n    caches.keys().then((keys) =>\n      Promise.all(\n        keys\n          .filter((key) => key !== CACHE_NAME && key !== SUBJECT_CACHE)\n          .map((key) => caches.delete(key))\n      )\n    ).then(() => self.clients.claim())\n  );\n});\n\nself.addEventListener('fetch', (event) => {\n  const request = event.request;\n  const url = new URL(request.url);\n  \n  // Only handle same-origin GET requests\n  if (request.method !== 'GET' || url.origin !== self.location.origin) return;\n  \n  // API requests - network first, fallback to offline response\n  if (url.pathname.startsWith('/api/')) {\n    event.respondWith(\n      fetch(request)\n        .then((response) => {\n          if (response.ok) {\n            const copy = response.clone();\n            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));\n          }\n          return response;\n        })\n        .catch(() => caches.match(request).then((cached) => cached || new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' }})))\n    );\n    return;\n  }\n  \n  // Subject lab HTML files - cache first, then network\n  const isSubjectLab = url.pathname.startsWith('/subjects/') && url.pathname.endsWith('.html');\n  const cacheName = isSubjectLab ? SUBJECT_CACHE : CACHE_NAME;\n  \n  event.respondWith(\n    caches.match(request).then((cached) => {\n      if (cached) return cached;\n      \n      return fetch(request).then((response) => {\n        if (response.ok && (response.type === 'basic' || response.type === 'cors')) {\n          const copy = response.clone();\n          caches.open(cacheName).then((cache) => cache.put(request, copy));\n        }\n        return response;\n      }).catch(async () => {\n        // Offline fallback for navigation requests\n        if (request.mode === 'navigate') {\n          const fallback = await caches.match('/') || await caches.match('/index.html');\n          return fallback || new Response('Offline', { status: 503 });\n        }\n        return new Response('Offline', { status: 503 });\n      });\n    })\n  );\n});\n\n// Background sync for progress data\nself.addEventListener('sync', (event) => {\n  if (event.tag === 'sync-progress') {\n    event.waitUntil(syncProgress());\n  }\n});\n\nasync function syncProgress() {\n  try {\n    const clients = await self.clients.matchAll();\n    clients.forEach((client) => client.postMessage({ type: 'sync-progress' }));\n  } catch (e) {\n    console.log('Background sync failed:', e);\n  }\n}\n`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), offlineShell()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})