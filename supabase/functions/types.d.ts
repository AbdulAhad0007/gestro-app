// Type declarations for Deno runtime globals used in Supabase Edge Functions.
// This file ensures TypeScript recognizes `Deno.env` etc. even when the
// Deno VS Code extension is not installed or not activating.

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }

  export const env: Env;
}
