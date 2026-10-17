import { createFormRequestMiddleware } from './form-request-engine';
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(
  createFormRequestMiddleware({
    endpoint: '/api/inquiry',
    requestPrefix: 'AX-',
    limiterPrefix: 'alienx-inquiry:',
    protection: async () => {
      const { env } = await import('cloudflare:workers');
      const bindings = env as unknown as {
        INQUIRY_RATE_LIMITER?: {
          limit(options: { key: string }): Promise<{ success: boolean }>;
        };
        TURNSTILE_SECRET?: string;
        TURNSTILE_HOSTNAMES?: string;
      };
      return {
        limiter: bindings.INQUIRY_RATE_LIMITER,
        secret: bindings.TURNSTILE_SECRET,
        hostnames: bindings.TURNSTILE_HOSTNAMES,
      };
    },
    limited: {
      error: 'Too many inquiries. Please try again later.',
      code: 'rate-limited',
    },
    unavailable: {
      error: 'Inquiry protection is unavailable. Please try again later.',
    },
    json: {
      maxBytes: 16_384,
      action: 'contact',
      tokenField: 'website',
      trapField: 'faxNumber',
      retryHeader: 'Idempotency-Key',
      errors: {
        retry: { error: 'Invalid retry key.' },
        media: { error: 'Unsupported content type.' },
        origin: { error: 'Invalid request origin.' },
        size: { error: 'Request is too large.' },
        parse: { error: 'Invalid request.' },
        configuration: {
          error: 'Security verification is not configured.',
          code: 'turnstile-not-configured',
        },
        trap: {
          error: 'We could not verify this inquiry. Please try again.',
          code: 'inquiry-rejected',
        },
        token: {
          error: 'Please complete the security verification.',
          code: 'turnstile-missing',
        },
        expired: {
          error:
            'The security check expired. Please complete it again and submit the form.',
          code: 'turnstile-expired',
        },
        failed: {
          error: 'Security verification failed. Please try again.',
          code: 'turnstile-failed',
        },
        verificationUnavailable: {
          error: 'Security verification could not be completed.',
          code: 'turnstile-unavailable',
        },
      },
      verified: (locals, payload, requestId) => {
        locals.verifiedInquiry = { payload, requestId };
      },
    },
  }),
);
