import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.json',
      persist: { path: './.wrangler/state/v3' },
    },
  }),
  vite: { plugins: [tailwindcss()] },
  integrations: [react()],
});
