/** Executa um fetch e devolve um fallback se falhar (API fora do ar não derruba a página). */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
