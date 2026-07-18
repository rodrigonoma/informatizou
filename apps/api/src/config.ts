import { loadEnv, type Env } from '@informatizou/config';

let cached: Env | undefined;

/** Env validado da API (memoizado). */
export function apiEnv(): Env {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}
