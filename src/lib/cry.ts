/**
 * Gritos (.ogg) del repo oficial de PokéAPI, por id nacional. Se usa la
 * variante `legacy` (los originales de Game Boy): los `latest` suenan
 * procesados en varios Pokémon de Gen 1.
 */
const CRIES_URL =
  "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy";

export const cryUrl = (id: number) => `${CRIES_URL}/${id}.ogg`;

const VOLUME = 0.5;

// Un único reproductor: al pedir otro grito se corta el anterior, así nunca
// suenan dos a la vez aunque se seleccione rápido.
let player: HTMLAudioElement | null = null;
let muted = false;

export function setCriesMuted(value: boolean) {
  muted = value;
  if (muted) stopCry();
}

export function stopCry() {
  player?.pause();
}

/** Reproduce el grito de `id`. Debe llamarse desde un gesto del usuario (click). */
export function playCry(id: number) {
  if (muted || typeof Audio === "undefined") return;
  stopCry();
  player ??= new Audio();
  player.src = cryUrl(id);
  player.volume = VOLUME;
  // Si el navegador bloquea el audio o el archivo falta, se ignora en silencio.
  player.play().catch(() => {});
}
