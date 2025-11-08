declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export interface ConnInfo {
    localAddr: { hostname: string; port: number };
    remoteAddr: { hostname: string; port: number };
  }

  export type Handler = (
    request: Request,
    info: ConnInfo
  ) => Response | Promise<Response>;

  export function serve(handler: Handler): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}


