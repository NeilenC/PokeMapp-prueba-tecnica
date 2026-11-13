import { typeColor, typeLabel } from "@/lib/type-colors";

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="rounded-full px-3 py-0.5 text-xs font-bold text-slate-900"
      style={{ backgroundColor: typeColor(type) }}
    >
      {typeLabel(type)}
    </span>
  );
}
