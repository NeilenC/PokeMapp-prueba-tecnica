/** Esqueleto con el mismo layout que el contenido final del panel. */
export function PokemonSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 p-5 motion-safe:animate-pulse">
      <div className="mx-auto size-[200px] rounded-lg bg-white/10" />
      <div className="h-7 w-3/5 rounded-lg bg-white/10" />
      <div className="h-5 w-2/5 rounded-lg bg-white/10" />
      <div className="h-16 rounded-lg bg-white/10" />
      <div className="h-12 rounded-lg bg-white/10" />
    </div>
  );
}
