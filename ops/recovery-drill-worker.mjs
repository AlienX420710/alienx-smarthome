export default {
  async fetch(_request, env) {
    const state = env.DRILL_STATE ?? 'unknown';
    const body = {
      ok: state !== 'rejected-candidate',
      state,
      sourceSha: env.SOURCE_SHA ?? null,
      versionId: env.CF_VERSION_METADATA?.id ?? null,
      versionTag: env.CF_VERSION_METADATA?.tag ?? null,
      versionTimestamp: env.CF_VERSION_METADATA?.timestamp ?? null,
    };

    return Response.json(body, {
      status: state === 'rejected-candidate' ? 503 : 200,
      headers: {
        'cache-control': 'no-store',
      },
    });
  },
};
