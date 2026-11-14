/** Color y nombre en español de cada tipo (los 15 que existen en Gen 1). */
const TYPES: Record<string, { color: string; label: string }> = {
  normal: { color: "#a8a77a", label: "Normal" },
  fire: { color: "#ee8130", label: "Fuego" },
  water: { color: "#6390f0", label: "Agua" },
  electric: { color: "#f7d02c", label: "Eléctrico" },
  grass: { color: "#7ac74c", label: "Planta" },
  ice: { color: "#96d9d6", label: "Hielo" },
  fighting: { color: "#c22e28", label: "Lucha" },
  poison: { color: "#a33ea1", label: "Veneno" },
  ground: { color: "#e2bf65", label: "Tierra" },
  flying: { color: "#a98ff3", label: "Volador" },
  psychic: { color: "#f95587", label: "Psíquico" },
  bug: { color: "#a6b91a", label: "Bicho" },
  rock: { color: "#b6a136", label: "Roca" },
  ghost: { color: "#735797", label: "Fantasma" },
  dragon: { color: "#6f35fc", label: "Dragón" },
  steel: { color: "#b7b7ce", label: "Acero" },
  fairy: { color: "#d685ad", label: "Hada" },
};

const FALLBACK = { color: "#94a3b8", label: "Desconocido" };

export const typeColor = (type: string) => (TYPES[type] ?? FALLBACK).color;
export const typeLabel = (type: string) => TYPES[type]?.label ?? type;
