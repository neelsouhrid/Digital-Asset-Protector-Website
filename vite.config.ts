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
  // Override the Lovable preset's default Cloudflare target with Netlify.
  // For TanStack Start ≥ 1.132, the modern way is the @netlify/vite-plugin-tanstack-start
  // plugin (see netlify.toml). We forward `target: "netlify"` to tanstackStart so
  // Nitro emits a Netlify-compatible build artifact (.netlify/v1/functions/...).
  vite: {
    build: {
      target: "es2022",
    },
  },
});
