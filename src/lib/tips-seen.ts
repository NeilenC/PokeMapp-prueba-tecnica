/**
 * Recuerda qué mensajes del tutorial ya vio el entrenador, para que cada uno
 * salte una sola vez. Es genérico: no conoce los mensajes, solo sus ids. Si el
 * storage está bloqueado (modo privado) se asume que ya los vio: mejor no
 * mostrarlos que repetirlos en cada recarga.
 */

const key = (id: string) => `pokemapp:tip-seen:${id}:v1`;

/** Ids ya vistos, entre los pedidos. */
export function readSeenTips(ids: readonly string[]): ReadonlySet<string> {
  const seen = new Set<string>();
  try {
    for (const id of ids) {
      if (window.localStorage.getItem(key(id)) === "1") seen.add(id);
    }
  } catch {
    for (const id of ids) seen.add(id);
  }
  return seen;
}

export function markTipSeen(id: string): void {
  try {
    window.localStorage.setItem(key(id), "1");
  } catch {
    // Sin persistencia: el mensaje igual se cierra con normalidad.
  }
}

/** Vuelve a habilitar los mensajes pedidos (al reiniciar el juego). */
export function clearSeenTips(ids: readonly string[]): void {
  try {
    for (const id of ids) window.localStorage.removeItem(key(id));
  } catch {
    // Sin acceso al storage: el reinicio igual vale en memoria.
  }
}
