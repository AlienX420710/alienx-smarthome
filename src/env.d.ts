type Env = import("../worker-configuration").Env;
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    verifiedInquiry?: { payload: Record<string, unknown>; requestId: string };
  }
}

interface Window {
  __alienxSetTheme?: (theme: string) => void;
  __alienxSetMotion?: (motion: string) => void;
  __alienxTurnstileWidgetId?: string | null;
  __alienxTurnstileReset?: () => void;
}

declare module 'cloudflare:workers' {
  export const env: import('../worker-configuration').Env;
}
