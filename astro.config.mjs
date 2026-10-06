// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { site } from './scripts/site-config.mjs';
export default defineConfig({
  site: site.origin,
  output: site.rendering,
  session: false,
  ...(site.csp.externalStyles ? { build: { inlineStylesheets: 'never' } } : {}),
  integrations: [
    sitemap({
      filter: (page) => {
        const route = new URL(page).pathname.replace(/\/$/, '');
        return (
          !site.noindexRoutes.some(
            (/** @type {string} */ item) => route === item.replace(/\/$/, ''),
          ) && !['/404', '/500'].includes(route)
        );
      },
    }),
  ],
  ...(site.csp.generatedHashes
    ? {
        security: {
          csp: {
            directives: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "form-action 'self'",
              `img-src ${site.csp.imageSources.join(' ')}`,
              "font-src 'self'",
              "connect-src 'self' https://challenges.cloudflare.com",
              'frame-src https://challenges.cloudflare.com',
            ],
            scriptDirective: {
              resources: ["'self'", 'https://challenges.cloudflare.com'],
            },
          },
        },
      }
    : {}),
  adapter: cloudflare({
    inspectorPort:
      process.env.SITE_DISABLE_INSPECTOR === '1' ||
      process.env.ALIENX_DISABLE_INSPECTOR === '1'
        ? false
        : undefined,
  }),
});
