// DEMO-ONLY config -- not part of the shipping build, do not commit.
// Serves the site over HTTPS (self-signed) bound to the LAN so phones/laptops/
// the ClockworkPi get a secure context (required for the Cheffy notifications /
// service worker). Run: npx astro dev --config astro.demo.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import fs from 'node:fs';

const CERT = '/private/tmp/claude-501/-Users-ianschuepbach/93d664bf-cf88-4930-97a5-120f34f305ea/scratchpad';

export default defineConfig({
  site: 'https://sh-ui.github.io',
  base: '/',
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false, configFile: './tailwind.config.mjs' }),
  ],
  server: { host: true, port: 4443 },
  vite: {
    server: {
      https: {
        key: fs.readFileSync(`${CERT}/demo-key.pem`),
        cert: fs.readFileSync(`${CERT}/demo-cert.pem`),
      },
      hmr: { protocol: 'wss' },
    },
  },
});
