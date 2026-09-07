import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ request }) => {
  const bindings = env as unknown as { TURNSTILE_SECRET?: string; TURNSTILE_HOSTNAMES?: string; RESEND_API_KEY?: string };
  const checks = {
    worker: { status: 'operational', detail: 'Cloudflare Worker responding' },
    inquiry: { status: 'operational', detail: 'Inquiry endpoint available' },
    turnstile: { status: bindings.TURNSTILE_SECRET && bindings.TURNSTILE_HOSTNAMES ? 'configured' : 'degraded', detail: bindings.TURNSTILE_SECRET && bindings.TURNSTILE_HOSTNAMES ? 'Turnstile protection configured' : 'Turnstile configuration incomplete' },
    resend: { status: bindings.RESEND_API_KEY ? 'configured' : 'degraded', detail: bindings.RESEND_API_KEY ? 'Resend API configured' : 'Resend API key missing' },
  };
  const degraded = Object.values(checks).some((check) => check.status === 'degraded');
  return json({ ok: !degraded, status: degraded ? 'degraded' : 'operational', generatedAt: new Date().toISOString(), requestId: request.headers.get('cf-ray') ?? crypto.randomUUID(), checks, runtime: 'Cloudflare Workers' });
};
