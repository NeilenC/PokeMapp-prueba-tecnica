import { getVolumeSnapshot } from "@/lib/volume-store";

/**
 * Gritos (.ogg) del repo oficial de PokéAPI, por id nacional. Se usa la
 * variante `legacy` (los originales de Game Boy): los `latest` suenan
 * procesados en varios Pokémon de Gen 1.
 */
const CRIES_URL =
  "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy";

export const cryUrl = (id: number) => `${CRIES_URL}/${id}.ogg`;


// Los `legacy` son de Game Boy (10,5 kHz): suenan agudos y rápidos. Reproducirlos
// más lento sin conservar el tono los baja de frecuencia y los alarga. 1 = original.
const PLAYBACK_RATE = 0.7;

// Un único reproductor: al pedir otro grito se corta el anterior, así nunca
// suenan dos a la vez aunque se seleccione rápido.
let player: HTMLAudioElement | null = null;

// Silencio: se guarda en localStorage y se expone como almacén externo para
// `useSyncExternalStore` (el servidor siempre ve "con sonido").
const MUTED_KEY = "pokemapp:muted:v1";
let muted = false;
let mutedLoaded = false;
const mutedListeners = new Set<() => void>();

function loadMuted() {
  if (mutedLoaded) return;
  mutedLoaded = true;
  try {
    muted = window.localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    muted = false;
  }
}

export function subscribeMuted(listener: () => void): () => void {
  mutedListeners.add(listener);
  return () => mutedListeners.delete(listener);
}

export function getMutedSnapshot(): boolean {
  loadMuted();
  return muted;
}

export function getServerMutedSnapshot(): boolean {
  return false;
}

export function setCriesMuted(value: boolean) {
  loadMuted();
  if (value === muted) return;
  muted = value;
  try {
    window.localStorage.setItem(MUTED_KEY, value ? "1" : "0");
  } catch {
    // Sin persistencia: el silencio vale mientras la página siga abierta.
  }
  if (muted) stopCry();
  for (const listener of mutedListeners) listener();
}

/** ¿Hay un grito sonando ahora mismo? */
export function isCryPlaying(): boolean {
  return player !== null && !player.paused && !player.ended;
}

export function stopCry() {
  player?.pause();
}

/** Reproduce el grito de `id`. Debe llamarse desde un gesto del usuario (click). */
export function playCry(id: number) {
  if (typeof Audio === "undefined" || getMutedSnapshot()) return;
  stopCry();
  player ??= new Audio();
  // `defaultPlaybackRate` hace que la velocidad sobreviva al cambio de `src`.
  player.defaultPlaybackRate = PLAYBACK_RATE;
  player.preservesPitch = false;
  player.src = cryUrl(id);
  player.playbackRate = PLAYBACK_RATE;
  player.volume = getVolumeSnapshot();
  // Si el navegador bloquea el audio o el archivo falta, se ignora en silencio.
  player.play().catch(() => {});
}
