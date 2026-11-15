/**
 * Volumen general (0..1) de todos los sonidos del juego. Mismo patrón que el
 * silencio de `cry`: almacén externo para `useSyncExternalStore`, persistido en
 * localStorage y leído solo en el cliente. No conoce a quién lo usa: cada
 * sonido (gritos, lluvia) lo multiplica por su propio nivel base.
 */

const KEY = "pokemapp:volume:v1";
export const DEFAULT_VOLUME = 0.5;

let volume = DEFAULT_VOLUME;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const n = raw === null ? NaN : Number(raw);
    if (Number.isFinite(n)) volume = Math.min(Math.max(n, 0), 1);
  } catch {
    volume = DEFAULT_VOLUME;
  }
}

export function subscribeVolume(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVolumeSnapshot(): number {
  load();
  return volume;
}

export function getServerVolumeSnapshot(): number {
  return DEFAULT_VOLUME;
}

export function setVolume(value: number): void {
  load();
  const next = Math.min(Math.max(value, 0), 1);
  if (next === volume) return;
  volume = next;
  try {
    window.localStorage.setItem(KEY, String(next));
  } catch {
    // Sin persistencia: el volumen vale mientras la página siga abierta.
  }
  for (const listener of listeners) listener();
}
