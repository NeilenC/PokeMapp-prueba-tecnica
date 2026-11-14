"use client";

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

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar el juego?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a perder {discovered === 1 ? "el Pokémon descubierto" : `los ${discovered} Pokémon descubiertos`},
            tu equipo de expedición y tu compañero. Todos vuelven a ser siluetas. Esto no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onReset}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Reiniciar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
