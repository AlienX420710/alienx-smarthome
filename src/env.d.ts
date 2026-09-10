type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    verifiedInquiry?: { payload: Record<string, unknown>; requestId: string };
  }
}
