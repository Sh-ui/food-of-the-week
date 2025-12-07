import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://sh-ui.github.io',
  // Use base path for production (GitHub Pages), empty for local dev
  base: import.meta.env.PROD ? '/food-of-the-week' : '/',
  output: 'static'
});

