// Post-build patch: modify the SSR error page to include the actual error
// message so we can diagnose 500s on Netlify. Remove this once debugging is done.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const serverPath = join('dist', 'server', 'server.js');
let code = readFileSync(serverPath, 'utf8');

// Patch the catch block to include error details in the HTML
code = code.replace(
  /catch \(error\) \{\s*console\.error\(error\);\s*return new Response\(renderErrorPage\(\)/,
  `catch (error) {
      console.error(error);
      const msg = error?.message || String(error);
      const stack = error?.stack || '';
      return new Response(renderErrorPage() + '<!-- SSR_ERROR: ' + msg.replace(/--/g,'- -') + ' STACK: ' + stack.replace(/--/g,'- -') + ' -->'`
);

writeFileSync(serverPath, code, 'utf8');
console.log('[patch-error-page] Patched dist/server/server.js to expose SSR errors');
