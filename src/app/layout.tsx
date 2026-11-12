import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokeMapp — Radar Pokémon de Argentina",
  description: "Explorá el mundo Pokémon sobre un mapa interactivo de Argentina.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
