/**
 * Equipo de expedición: hasta 6 favoritos en orden de incorporación y, entre
 * ellos, un compañero activo. Mismo patrón que `discovered-store`: almacén
 * externo para `useSyncExternalStore`, persistido en localStorage y leído solo
 * en el cliente.
 */

export const TEAM_SIZE = 6;

const TEAM_KEY = "pokemapp:team:v1";
const COMPANION_KEY = "pokemapp:companion:v1";
const EMPTY: readonly number[] = [];

let team: readonly number[] = EMPTY;
/** Siempre es uno de `team` (o `null`). */
let companion: number | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(TEAM_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((n): n is number => Number.isInteger(n));
      team = [...new Set(ids)].slice(0, TEAM_SIZE);
    }
    const saved: unknown = JSON.parse(
      window.localStorage.getItem(COMPANION_KEY) ?? "null",
    );
    companion =
      typeof saved === "number" && team.includes(saved) ? saved : null;
  } catch {
    team = EMPTY;
    companion = null;
  }
}

/** Guarda el estado actual y avisa a los suscriptores. */
function commit() {
  try {
    window.localStorage.setItem(TEAM_KEY, JSON.stringify(team));
    window.localStorage.setItem(COMPANION_KEY, JSON.stringify(companion));
  } catch {
    // Sin persistencia (modo privado, cuota): el equipo sigue en memoria.
  }
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** La referencia solo cambia cuando el equipo cambia (requisito de React). */
export function getSnapshot(): readonly number[] {
  load();
  return team;
}

export function getServerSnapshot(): readonly number[] {
  return EMPTY;
}

export function getCompanionSnapshot(): number | null {
  load();
  return companion;
}

export function getServerCompanionSnapshot(): number | null {
  return null;
}

/**
 * Suma `id` si hay lugar y no estaba; devuelve `false` si el equipo está lleno.
 * Si todavía no había compañero, el primero que entra lo es.
 */
export function addToTeam(id: number): boolean {
  load();
  if (team.includes(id)) return true;
  if (team.length >= TEAM_SIZE) return false;
  team = [...team, id];
  if (companion === null) companion = id;
  commit();
  return true;
}

export function removeFromTeam(id: number): void {
  load();
  if (!team.includes(id)) return;
  team = team.filter((n) => n !== id);
  if (companion === id) companion = null;
  commit();
}

/** Elige al compañero entre los del equipo; `null` = sin compañero. */
export function setCompanion(id: number | null): void {
  load();
  if (id !== null && !team.includes(id)) return;
  if (id === companion) return;
  companion = id;
  commit();
}
