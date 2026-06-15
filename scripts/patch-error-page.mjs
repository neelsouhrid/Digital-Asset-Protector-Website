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

import { readFileSync } from 'fs';
const serverPath = join('dist', 'server', 'server.js');
let code = readFileSync(serverPath, 'utf8');

// Patch the catch block and catastrophic error normalizer to include error details in the HTML
code = code.replace(
  /function renderErrorPage\(\) \{([\s\S]*?)return `<!doctype html>([\s\S]*?)<\/html>`;\n\}/,
  `function renderErrorPage(errorMsg = '') {\n$1return \`<!doctype html>$2<!-- SSR_ERROR: \${errorMsg} -->\\n</html>\`;\n}`
);

code = code.replace(
  /new Response\(renderErrorPage\(\),/g,
  `new Response(renderErrorPage(String(error?.message || error || 'Unknown')),`
);

code = code.replace(
  /return new Response\(renderErrorPage\(\)/g,
  `return new Response(renderErrorPage(String(typeof error !== 'undefined' ? error : 'Unknown'))`
);

writeFileSync(serverPath, code, 'utf8');
console.log('[post-build] Patched dist/server/server.js to expose SSR errors in HTML');

