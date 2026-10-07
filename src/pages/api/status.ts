import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import release from '../../release.json';
import { statusResponse } from '../../status';

export const prerender = false;
export const GET: APIRoute = async ({ request }) =>
  statusResponse(env, 'GET', release.revision, request);
export const HEAD: APIRoute = async ({ request }) =>
  statusResponse(env, 'HEAD', release.revision, request);
export const ALL: APIRoute = async () =>
  statusResponse(env, 'OTHER', release.revision);
