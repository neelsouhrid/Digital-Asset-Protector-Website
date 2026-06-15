// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

export default defineConfig({
  // Disable the Lovable preset's built-in Nitro integration — the
  // @netlify/vite-plugin-tanstack-start plugin below takes over the build
  // and emits both the client (dist/client/) and the Netlify SSR function
  // (.netlify/v1/functions/server) in one pass.
  nitro: false,
  plugins: [
    netlify({
      // TanStack Start server entry — same as the default.
      // Override only if you rename src/server.ts.
    }),
  ],
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      target: "es2022",
    },
  },
});
