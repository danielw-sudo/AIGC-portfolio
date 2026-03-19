import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    configPath: 'wrangler.json',
    persistState: { path: './.wrangler/state/v3' },
    remoteBindings: false,
  }),
  vite: { plugins: [tailwindcss()] },
});
