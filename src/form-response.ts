export function jsonFormResponse(
  body: Record<string, unknown>,
  status = 200,
  requestId?: string,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(status === 405 ? { Allow: 'POST' } : {}),
      ...(requestId ? { 'X-Request-ID': requestId } : {}),
    },
  });
}
export function createFormResponder(
  request: Request,
  renderError: (body: Record<string, unknown>, id?: string) => string,
) {
  const accept = request.headers.get('accept') ?? '';
  const wantsHTML =
    accept.includes('text/html') && !accept.includes('application/json');
  return (body: Record<string, unknown>, status = 200, requestId?: string) => {
    if (!wantsHTML || status < 400)
      return jsonFormResponse(body, status, requestId);
    return new Response(renderError(body, requestId), {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...(requestId ? { 'X-Request-ID': requestId } : {}),
      },
    });
  };
}
export function acceptedFormResponse(
  request: Request,
  requestId: string,
  destination: string,
) {
  if (request.headers.get('accept')?.includes('application/json'))
    return jsonFormResponse({ ok: true, requestId }, 200, requestId);
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(destination, request.url).href,
      'Cache-Control': 'no-store',
      'X-Request-ID': requestId,
    },
  });
}
