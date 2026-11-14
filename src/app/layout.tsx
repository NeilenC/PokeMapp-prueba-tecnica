import type { Metadata, Viewport } from "next";
import "./globals.css";

// viewport-fit=cover habilita env(safe-area-inset-*); el teclado virtual
// achica el viewport (Chrome Android) en vez de tapar el buscador.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0b1020",
};

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
