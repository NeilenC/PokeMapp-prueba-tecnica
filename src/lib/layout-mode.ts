/**
 * Layout del panel de detalle según el dispositivo (SPEC §4.1).
 * Debe coincidir con los `@custom-variant sheet-bottom` / `sheet-side` de
 * globals.css: mobile y tablet en portrait usan bottom sheet; desktop y tablet
 * en landscape, drawer lateral.
 */
export const SHEET_BOTTOM_QUERY =
  "(max-width: 639.98px), (max-width: 1023.98px) and (orientation: portrait)";

/** Ancho del drawer lateral; coincide con `sheet-side:w-[380px]` del panel. */
export const SHEET_SIDE_WIDTH = 380;
/** Alto del bottom sheet en dvh; coincide con `h-[55dvh]` del panel. */
export const SHEET_BOTTOM_DVH = 55;

/** Pantalla táctil como puntero principal (móvil/tablet). */
export const COARSE_POINTER_QUERY = "(pointer: coarse)";

/**
 * Desplazamiento de `flyTo` para que el marcador quede en la parte visible
 * del mapa: arriba del bottom sheet, o a la izquierda del drawer lateral.
 */
export function sheetFlyOffset(): [number, number] {
  if (window.matchMedia(SHEET_BOTTOM_QUERY).matches) {
    const sheetPx = (window.innerHeight * SHEET_BOTTOM_DVH) / 100;
    return [0, -sheetPx / 2];
  }
  return [-SHEET_SIDE_WIDTH / 2, 0];
}
