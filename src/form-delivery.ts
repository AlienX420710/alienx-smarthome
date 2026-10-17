export type MailAcceptance =
  | { outcome: 'accepted'; id: string }
  | { outcome: 'request-failed' }
  | { outcome: 'rejected'; status: number }
  | { outcome: 'unconfirmed' };

// Provider bodies and thrown exceptions never become public errors or logs.
export async function acceptMail(
  send: () => Promise<Response>,
): Promise<MailAcceptance> {
  let response: Response;
  try {
    response = await send();
  } catch {
    return { outcome: 'request-failed' };
  }
  if (!response.ok) return { outcome: 'rejected', status: response.status };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { outcome: 'unconfirmed' };
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    !('id' in payload) ||
    typeof payload.id !== 'string' ||
    !payload.id.trim()
  )
    return { outcome: 'unconfirmed' };
  return { outcome: 'accepted', id: payload.id };
}
