import { defineConfig } from 'vite';

// A relative base lets one build run unchanged at the GitHub Pages project URL
// (https://<user>.github.io/beyond-the-sparkle/), at a custom-domain root, or
// under `vite preview`. Runtime asset URLs are built from import.meta.env.BASE_URL.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true }
});
