/**
 * A missing secret must fail the run loudly and up front. A pipeline that
 * "succeeds" while silently skipping Instagram is worse than a red build.
 */
export function requireEnv(...names: string[]): void {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
