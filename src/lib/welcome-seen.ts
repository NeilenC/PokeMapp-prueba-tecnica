/**
 * Recuerda si el entrenador ya vio el modal de bienvenida, para mostrarlo solo
 * en la primera visita. Si el storage está bloqueado (modo privado) se asume
 * que ya lo vio: mejor no mostrarlo que repetirlo en cada recarga.
 */

const STORAGE_KEY = "pokemapp:welcome-seen:v1";

export function hasSeenWelcome(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markWelcomeSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Sin persistencia: el modal igual se cierra con normalidad.
  }
}
