import type { IControl, Map as MapLibreMap } from "maplibre-gl";

const ARROW_UP =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
const ARROW_DOWN =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

interface Options {
  /** Grados que suma o resta cada toque. */
  step?: number;
  /** Duración del movimiento de cámara, en ms. */
  duration?: number;
}

/**
 * Control de MapLibre con dos botones para inclinar la cámara (pitch) sin
 * gestos: en el celular el deslizamiento con dos dedos no siempre se reconoce.
 * Se apila con la brújula (`ctrl-group`) y respeta el `maxPitch` del mapa. No
 * conoce nada del juego: sirve para cualquier mapa.
 */
export class TiltControl implements IControl {
  private map: MapLibreMap | null = null;
  private container: HTMLElement | null = null;
  private more: HTMLButtonElement | null = null;
  private less: HTMLButtonElement | null = null;
  private readonly step: number;
  private readonly duration: number;

  constructor({ step = 10, duration = 250 }: Options = {}) {
    this.step = step;
    this.duration = duration;
  }

  onAdd(map: MapLibreMap): HTMLElement {
    this.map = map;
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.more = this.button("Inclinar la cámara hacia el horizonte", ARROW_UP, +1);
    this.less = this.button("Inclinar la cámara hacia arriba (vista desde el cielo)", ARROW_DOWN, -1);
    container.append(this.more, this.less);
    this.container = container;
    map.on("pitch", this.sync);
    this.sync();
    return container;
  }

  onRemove(): void {
    this.map?.off("pitch", this.sync);
    this.container?.remove();
    this.map = this.container = this.more = this.less = null;
  }

  private button(label: string, icon: string, direction: 1 | -1) {
    const b = document.createElement("button");
    b.type = "button";
    b.ariaLabel = label;
    b.title = label;
    b.innerHTML = icon;
    b.addEventListener("click", () => this.tilt(direction));
    return b;
  }

  private tilt(direction: 1 | -1) {
    const map = this.map;
    if (!map) return;
    const pitch = Math.min(
      map.getMaxPitch(),
      Math.max(0, map.getPitch() + direction * this.step),
    );
    map.easeTo({ pitch, duration: this.duration });
  }

  /** Deshabilita cada botón al llegar a su tope. */
  private sync = () => {
    const map = this.map;
    if (!map || !this.more || !this.less) return;
    this.more.disabled = map.getPitch() >= map.getMaxPitch() - 0.5;
    this.less.disabled = map.getPitch() <= 0.5;
  };
}
