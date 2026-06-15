// Post-build: ensure dist/server/ is treated as ESM by Node.js.
//
// The Vite SSR build emits dist/server/server.js with ESM syntax (export {}).
// On Netlify's Lambda runtime the root package.json (which has "type":"module")
// may not be present alongside the function, so Node.js defaults .js → CJS
// and chokes on the `export` keyword.
//
// Dropping a tiny package.json into dist/server/ forces Node.js to treat every
// .js file in that tree as ESM.
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const dir = join('dist', 'server');
mkdirSync(dir, { recursive: true });
writeFileSync(
  join(dir, 'package.json'),
  JSON.stringify({ type: 'module' }, null, 2) + '\n',
  'utf8'
);
console.log('[post-build] Wrote dist/server/package.json {"type":"module"}');
