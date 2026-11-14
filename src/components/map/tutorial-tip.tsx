"use client";

import type { TutorialTipDef } from "@/lib/tutorial-tips";
import { ArcadeTip } from "./arcade-tip";

interface Props {
  /** Mensaje activo (o `null`); solo se dibuja si es de esta ancla. */
  tip: TutorialTipDef | null;
  anchor: string;
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * Une un mensaje del tutorial con su globo: lo dibuja únicamente donde
 * corresponde, así cada componente declara su ancla y no conoce los textos.
 */
export function TutorialTip({ tip, anchor, onDismiss, className }: Props) {
  if (!tip || tip.anchor !== anchor) return null;
  return (
    <ArcadeTip
      title={tip.title}
      text={tip.text}
      arrowLeft={tip.arrowLeft}
      onDismiss={() => onDismiss(tip.id)}
      className={className}
    />
  );
}
