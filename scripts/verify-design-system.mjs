import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = fileURLToPath(new URL('../apps/web/src/', import.meta.url))
const tokenFile = 'styles/smartclass-design-system.css'
const files = []
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (/\.(?:css|tsx|ts)$/.test(entry.name)) files.push(full)
  }
}
await walk(sourceRoot)
const failures = []
for (const file of files) {
  const rel = relative(sourceRoot, file).replaceAll('\\', '/')
  if (rel === tokenFile) continue
  const text = await readFile(file, 'utf8')
  if (/#(?:[0-9a-fA-F]{3,8})\b/.test(text)) failures.push(`${rel}: hardcoded hex colour`)
  if (/\b(?:rgb|rgba|hsl|hsla)\s*\(/i.test(text)) failures.push(`${rel}: hardcoded colour function`)
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('PASS: no hardcoded colour literals outside the design-token file.')
