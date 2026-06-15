// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force the Nitro preset to "netlify" so the build emits a Netlify
  // function bundle at .netlify/v1/functions/server (see netlify.toml).
  // The Lovable preset's default would target cloudflare, which would
  // produce .cloudflare/... instead and break the redirect.
  nitro: {
    preset: "netlify",
  },
  vite: {
    build: {
      target: "es2022",
    },
  },
});
