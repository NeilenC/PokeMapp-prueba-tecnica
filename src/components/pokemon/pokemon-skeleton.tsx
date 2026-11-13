/** Esqueleto con el mismo layout que el contenido final del panel. */
export function PokemonSkeleton() {
  return (
    <div aria-hidden="true" className="drawer-skeleton">
      <div className="skeleton" style={{ width: 200, height: 200, margin: "0 auto" }} />
      <div className="skeleton" style={{ width: "60%", height: 28 }} />
      <div className="skeleton" style={{ width: "40%", height: 22 }} />
      <div className="skeleton" style={{ width: "100%", height: 64 }} />
      <div className="skeleton" style={{ width: "100%", height: 48 }} />
    </div>
  );
}
