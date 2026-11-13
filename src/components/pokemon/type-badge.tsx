import { typeColor, typeLabel } from "@/lib/type-colors";

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 999,
        background: typeColor(type),
        color: "#0b1020",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {typeLabel(type)}
    </span>
  );
}
