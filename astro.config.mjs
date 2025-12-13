import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://sh-ui.github.io',
  // Use base path for production (GitHub Pages), empty for local dev
  base: import.meta.env.PROD ? '/food-of-the-week' : '/',
  output: 'static',
  integrations: [
    tailwind({
      // Use existing CSS alongside Tailwind - don't replace base styles
      applyBaseStyles: false,
    }),
  ],
});

