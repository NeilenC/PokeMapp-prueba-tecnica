# PokeMapp — Radar Pokemon de Argentina

Mapa interactivo en 3D de Argentina donde viven los 151 Pokemon de la primera generación. Recorré el país con la cámara, usá el radar para descubrirlos, armá tu equipo de expedición y completá tu Pokedex.

La PokéAPI no provee ubicaciones, así que cada Pokemon se asigna a una zona del país según su tipo y el bioma/clima de esa zona (por ejemplo, los de hielo en la Patagonia, los de agua cerca de lagos y ríos). Las posiciones son **deterministas**: son las mismas en cada recarga y para todos los usuarios.

## Cómo se juega

1. **Explorá el mapa.** Al iniciar, un popup de bienvenida resume los controles (el botón de ayuda lo vuelve a abrir).
2. **Descubrí Pokemon.** Todos arrancan como siluetas. El radar del centro de la pantalla gira y revela a los que cruza dentro de su círculo: movete por el mapa para acercarte a ellos.
3. **Abrí la ficha.** Tocá un Pokemon descubierto para que la cámara vuele hasta él y se abra su detalle (tipos, estadísticas, altura, peso) con su grito.
4. **Armá tu equipo.** Agregá hasta 6 favoritos con «Agregar al equipo» y elegí uno como compañero (♥): te acompaña en pantalla.
5. **Completá la Pokedex.** El panel «Pokemon por tipo» lista descubiertos y faltantes, con buscador y filtros.
6. **Cuidado con el clima.** En zonas de lluvia o niebla (p. ej. el Litoral) el radar se encoge y descubrís menos.

El progreso (descubiertos, equipo, compañero y sonido) se guarda en el `localStorage` del navegador. El botón de reinicio lo borra.

### Controles

| Acción | Mouse / teclado | Táctil |
|---|---|---|
| Mover el mapa | Arrastrar | Arrastrar |
| Zoom | Rueda | Pellizcar |
| Girar la cámara | `Alt` + `←` `→` | Girar con dos dedos |
| Acercar / alejar | `Alt` + `↑` / `↓` | Pellizcar |
| Rotar e inclinar | `Alt` + dos dedos (trackpad) | Dos dedos ↕ |
| Ver ficha | Clic en el Pokemon | Tocar |
| Volver al norte | Brújula | Brújula |

## Requisitos

- [Node.js](https://nodejs.org) 20.9 o superior (probado con 22).
- [pnpm](https://pnpm.io) 9 (`corepack enable` o `npm i -g pnpm`).
- Conexión a internet: usa PokéAPI, OpenFreeMap y los tiles de elevación. **No requiere API keys ni variables de entorno.**

## Cómo correrlo

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción (correr `pnpm build` antes) |
| `pnpm lint` | ESLint |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** estricto
- **MapLibre GL JS 6** con estilo de [OpenFreeMap](https://openfreemap.org) y terreno 3D (Terrarium)
- **Tailwind CSS 4** + componentes de shadcn/ui (Radix)
- **Framer Motion** para animaciones (respeta `prefers-reduced-motion`)
- Datos y recursos de [PokéAPI](https://pokeapi.co) (listado, detalle, sprites y gritos)

## Estructura

```
src/
  app/          # layout, página y API routes (/api/pokemon, /api/pokemon/[id])
  components/
    map/        # mapa, marcadores, radar, clima, minimapa, dock de equipo, filtros
    pokemon/    # ficha de detalle, skeleton, barras de stats
    ui/         # componentes base (shadcn)
  hooks/        # lista y detalle de Pokemon, tutorial, utilidades
  lib/          # spawn determinista, zonas, clima, stores en localStorage, PokéAPI
  types/
public/geo/     # GeoJSON de países vecinos (para ubicar Pokemon de agua)
```

## Decisiones de diseño

- **Spawn determinista** ([src/lib/spawn.ts](src/lib/spawn.ts)): el reparto de los 151 se calcula una sola vez, por afinidad de tipos con cada zona y con penalización a las zonas muy cargadas, de modo que todas reciban Pokemon y queden separados entre sí. Los de agua solo aparecen sobre puntos de agua reales.
- **Mapa sin SSR**: MapLibre depende de `window` y WebGL, por eso se carga con `next/dynamic` y `ssr: false` dentro de un Client Component.
- **Server vs Client**: `layout.tsx` y `page.tsx` son Server Components; solo las piezas interactivas son cliente. El detalle de cada Pokemon se pide bajo demanda con caché en memoria, con estados de carga (skeleton) y error (con reintento).
- **Responsive**: mobile-first (bottom sheet en móvil, drawer lateral en desktop), alturas con `dvh` y safe areas.

El detalle de la especificación está en [SPEC.md](SPEC.md) y el registro de cambios en [CHANGELOG.md](CHANGELOG.md).

## Notas para desarrollo

Este proyecto usa una versión de Next.js con cambios respecto a lo habitual: antes de escribir código nuevo, consultá la guía correspondiente en `node_modules/next/dist/docs/` (ver [AGENTS.md](AGENTS.md)).

## Uso de IA

Parte del código fue generado con asistencia de IA (Claude Code) y revisado y ajustado manualmente. Los cambios relevantes y sus justificaciones quedan registrados en [CHANGELOG.md](CHANGELOG.md).

## Créditos

Datos, sprites y gritos: [PokéAPI](https://pokeapi.co). Mapas: [OpenFreeMap](https://openfreemap.org) y © OpenStreetMap contributors. Elevación: [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/). Pokemon y sus nombres son marca de Nintendo / Game Freak; este es un proyecto sin fines de lucro con fines educativos.
