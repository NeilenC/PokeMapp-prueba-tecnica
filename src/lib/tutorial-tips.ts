/**
 * Mensajes del tutorial arcade, como datos. Para sumar uno nuevo alcanza con
 * agregar una entrada acá (y un `TutorialTip` en el lugar que explica): ni el
 * hook ni los componentes de presentación cambian.
 */

/** Lo que el juego sabe en este momento y los mensajes usan para decidir. */
export interface TutorialContext {
  teamSize: number;
}

export interface TutorialTipDef {
  id: string;
  /** Dónde se dibuja: cada componente muestra solo los mensajes de su ancla. */
  anchor: string;
  title: string;
  text: string;
  /** Posición horizontal de la flecha dentro del globo. */
  arrowLeft?: string;
  /** ¿Corresponde mostrarlo ahora? (el "ya visto" lo resuelve el hook). */
  when: (ctx: TutorialContext) => boolean;
}

/** El orden es la prioridad: solo se muestra el primero que corresponda. */
export const TUTORIAL_TIPS: readonly TutorialTipDef[] = [
  {
    id: "team",
    anchor: "dock-title",
    title: "¡ARMÁ TU EQUIPO!",
    text: "Abrí un Pokemon y tocá «Agregar al equipo» para sumarlo a tus favoritos. ¡Podés tener hasta 6!",
    when: (ctx) => ctx.teamSize === 0,
  },
  {
    id: "companion",
    anchor: "dock-first-heart",
    title: "¡TU COMPAÑERO!",
    text: "Tocá el corazón ♥ de un favorito para elegirlo como compañero de aventuras.",
    arrowLeft: "14px",
    when: (ctx) => ctx.teamSize > 0,
  },
];
