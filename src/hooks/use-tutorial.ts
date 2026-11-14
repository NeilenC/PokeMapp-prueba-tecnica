"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clearSeenTips, markTipSeen, readSeenTips } from "@/lib/tips-seen";
import type { TutorialContext, TutorialTipDef } from "@/lib/tutorial-tips";

/**
 * Decide qué mensaje del tutorial mostrar: el primero (por prioridad) que
 * corresponda al contexto y no se haya visto, y nunca mientras `paused`.
 * No sabe cómo se dibuja ni dónde: solo devuelve la definición activa.
 *
 * `tips` debe ser estable (una constante de módulo o memoizada).
 */
export function useTutorial(
  tips: readonly TutorialTipDef[],
  ctx: TutorialContext,
  paused = false,
) {
  // `null` hasta leer el storage (en el cliente): así SSR e hidratación coinciden.
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage solo existe en el cliente
    setSeen(readSeenTips(tips.map((t) => t.id)));
  }, [tips]);

  const active = useMemo(() => {
    if (!seen || paused) return null;
    return tips.find((t) => !seen.has(t.id) && t.when(ctx)) ?? null;
  }, [tips, seen, paused, ctx]);

  const dismiss = useCallback((id: string) => {
    markTipSeen(id);
    setSeen((prev) => new Set(prev).add(id));
  }, []);

  /** Vuelve a habilitar todos los mensajes (reiniciar el juego). */
  const reset = useCallback(() => {
    clearSeenTips(tips.map((t) => t.id));
    setSeen(new Set());
  }, [tips]);

  return { active, dismiss, reset };
}
