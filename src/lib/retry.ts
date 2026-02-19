export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseMs = 300
): Promise<T> {
  let err: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      if (i === retries - 1) break;
      await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, i)));
    }
  }
  throw err;
}