export function healthDate(
  scheduledTime: number,
  now = Date.now(),
): string | null {
  if (
    !Number.isFinite(scheduledTime) ||
    !Number.isFinite(now) ||
    scheduledTime > now + 60_000 ||
    now - scheduledTime > 15 * 60_000
  )
    return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(scheduledTime))
      .map(({ type, value }) => [type, value]),
  );
  return parts.hour === '05' && parts.minute === '00'
    ? `${parts.year}-${parts.month}-${parts.day}`
    : null;
}

// Cancellation is best-effort cleanup, never a reason to retry a permanent error.
export async function deliverHealth(
  date: string,
  send: () => Promise<Response>,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * 2 ** (attempt - 1)),
      );
    try {
      const response = await send();
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        try {
          await response.body?.cancel();
        } catch {
          /* Cleanup cannot mask disposition. */
        }
        if (!retryable) break;
        continue;
      }
      const result = (await response.json()) as { id?: unknown } | null;
      if (typeof result?.id === 'string' && result.id.trim()) {
        console.info('Daily email health accepted.', {
          date,
          emailId: result.id,
        });
        return;
      }
    } catch {
      /* Never log provider-controlled errors, bodies or credentials. */
    }
  }
  throw new Error('Daily email health not confirmed by provider');
}
