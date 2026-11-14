"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  /** Pokémon descubiertos hoy: se muestra en el aviso para dimensionar la pérdida. */
  discovered: number;
  onReset: () => void;
}

/** Botón para empezar de cero; pide confirmación porque no se puede deshacer. */
export function ResetGame({ discovered, onReset }: Props) {
  // Tras confirmar, el foco NO vuelve al botón de reiniciar: si volviera, se
  // abriría su tooltip y Enter (atajo del popup de bienvenida) lo activaría.
  const confirmed = useRef(false);

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Reiniciar juego"
              className="pointer-events-auto h-auto w-11 shrink-0 rounded-xl bg-slate-900/85 text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800 hover:text-red-300"
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Reiniciar juego</TooltipContent>
      </Tooltip>

      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          if (!confirmed.current) return; // Cancelar: foco al botón como siempre
          confirmed.current = false;
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar el juego?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a perder {discovered === 1 ? "el Pokemon descubierto" : `los ${discovered} Pokemon descubiertos`},
            tu equipo de expedición y tu compañero. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              confirmed.current = true;
              onReset();
            }}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Reiniciar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
