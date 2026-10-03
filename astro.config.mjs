// @ts-check
import { defineConfig } from 'astro/config';
import { execFileSync } from 'node:child_process';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  vite: {
    define: {
      __ALIENX_BUILD_SHA__: JSON.stringify(
        process.env.GITHUB_SHA ||
          execFileSync('git', ['rev-parse', 'HEAD'], {
            encoding: 'utf8',
          }).trim(),
      ),
    },
  },
  site: 'https://alienxsmarthome.com',
  session: false,
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '');
        return (
          !pathname.startsWith('/contact/success') &&
          pathname !== '/404' &&
          pathname !== '/500'
        );
      },
    }),
  ],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://challenges.cloudflare.com",
        'frame-src https://challenges.cloudflare.com',
      ],
      scriptDirective: {
        resources: ["'self'", 'https://challenges.cloudflare.com'],
      },
    },
  },
  // Allow restricted local runtimes to build without an inspector port probe.
  adapter: cloudflare({
    inspectorPort:
      process.env.ALIENX_DISABLE_INSPECTOR === '1' ? false : undefined,
  }),
});
