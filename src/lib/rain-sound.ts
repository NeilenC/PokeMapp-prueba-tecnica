import { getMutedSnapshot, subscribeMuted } from "@/lib/cry";
import { getVolumeSnapshot, subscribeVolume } from "@/lib/volume-store";

/**
 * Sonido de lluvia sintetizado con Web Audio (ruido filtrado en bucle), sin
 * archivos. El volumen sigue la intensidad de la lluvia (0..1) y respeta el
 * silencio global de `cry`. El navegador exige un gesto del usuario para
 * iniciar el audio, así que el contexto se crea/reanuda en el primer toque.
 */
// Con lluvia plena y volumen general al máximo. Más bajo que antes (0,35): la
// lluvia es ambiente y no debe tapar los gritos.
const MAX_GAIN = 0.2;
const FADE = 0.4; // constante de tiempo del fundido, en segundos

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let intensity = 0;
let listening = false;

function buildGraph(audio: AudioContext) {
  // 2 s de ruido blanco en bucle; con lowpass/highpass suena a lluvia.
  const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const high = audio.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 500;
  const low = audio.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 6500;

  gain = audio.createGain();
  gain.gain.value = 0;
  source.connect(high).connect(low).connect(gain).connect(audio.destination);
  source.start();
}

function apply() {
  if (!ctx || !gain) return;
  const target = getMutedSnapshot() ? 0 : intensity * MAX_GAIN * getVolumeSnapshot();
  gain.gain.setTargetAtTime(target, ctx.currentTime, FADE);
}

function unlock() {
  if (typeof AudioContext === "undefined") return;
  if (!ctx) {
    ctx = new AudioContext();
    buildGraph(ctx);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  apply();
}

/** Fija la intensidad de la lluvia (0 = sin sonido, 1 = lluvia plena). */
export function setRainIntensity(value: number) {
  intensity = Math.min(Math.max(value, 0), 1);
  if (typeof window === "undefined") return;
  if (!listening) {
    listening = true;
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    subscribeMuted(apply);
    subscribeVolume(apply);
  }
  apply();
}
