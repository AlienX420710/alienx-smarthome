import type { APIRoute } from 'astro';
import release from '../../release.json';
export const prerender = false;
export const GET: APIRoute = () =>
  Response.json(release, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export const ALL: APIRoute = () =>
  new Response(null, {
    status: 405,
    headers: { Allow: 'GET', 'Cache-Control': 'no-store' },
  });
