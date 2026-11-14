/**
 * Pokémon descubiertos por el radar. Almacén externo mínimo para usarlo con
 * `useSyncExternalStore`: persiste en localStorage y lo lee recién en el
 * cliente (en el servidor el snapshot es siempre vacío, sin errores de
 * hidratación).
 */

const STORAGE_KEY = "pokemapp:discovered:v1";
const EMPTY: ReadonlySet<number> = new Set();

let discovered: ReadonlySet<number> = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

/** Lee localStorage una sola vez; si está bloqueado o corrupto, parte de cero. */
function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      discovered = new Set(
        parsed.filter((n): n is number => Number.isInteger(n)),
      );
    }
  } catch {
    discovered = EMPTY;
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** La referencia solo cambia cuando se descubre algo nuevo (requisito de React). */
export function getSnapshot(): ReadonlySet<number> {
  load();
  return discovered;
}

export function getServerSnapshot(): ReadonlySet<number> {
  return EMPTY;
}

/** Marca como descubiertos los ids nuevos; ignora los que ya lo estaban. */
export function discover(ids: number[]): void {
  load();
  const fresh = ids.filter((id) => !discovered.has(id));
  if (fresh.length === 0) return;

  discovered = new Set([...discovered, ...fresh]);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered]));
  } catch {
    // Sin persistencia (modo privado, cuota): el descubrimiento sigue en memoria.
  }
  for (const listener of listeners) listener();
}
