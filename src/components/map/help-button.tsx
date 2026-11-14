"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Vuelve a mostrar el popup con los controles del juego. */
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Como jugar"
          onClick={onClick}
          className="pointer-events-auto h-auto w-11 shrink-0 rounded-xl bg-slate-900/85 text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800 hover:text-yellow-300"
        >
          <CircleHelp aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Como jugar</TooltipContent>
    </Tooltip>
  );
}
