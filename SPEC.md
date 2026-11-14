# SPEC — PokeMapp: Radar Pokémon de Argentina

## 1. Concepto

Aplicación que permite explorar el mundo Pokémon sobre un mapa interactivo de Argentina. La PokéAPI no provee ubicaciones, así que los Pokémon se distribuyen según una lógica propia: **cada región geográfica tiene un bioma/clima, y cada bioma atrae a ciertos tipos de Pokémon, pero esto lo veremos detenidamente más adela**. Los marcadores pulsan como un radar y, al seleccionarlos, se verá como un paneo de cámara que vuela hasta ellos y se abre un panel con el detalle.

### Lógica de distribución (spawn)

| Región | Bioma / clima | Tipos que aparecen |
|---|---|---|
| Patagonia | Frío, estepa, glaciares | ice, steel, rock, water |
| Cuyo | Montaña, árido | rock, ground, fire, fighting |
| NOA | Altiplano, desierto, quebradas | ground, fire, rock, poison |
| NEA | Selva, humedales, subtropical | grass, bug, water, poison |
| Pampa | Llanura templada | normal, flying, grass, electric |
| Centro / Córdoba | Sierras, clima templado | psychic, fairy, normal, ghost |

- Cada región se define como un polígono (bounding box o GeoJSON simplificado).
- Un Pokémon aparece en una región si **alguno de sus tipos** está en la lista del bioma. Si coincide con varias, se elige la de mayor afinidad (primer tipo coincidente).
- La posición dentro de la región es **determinista**: PRNG con semilla = id del Pokémon. Las posiciones no cambian entre recargas ni entre usuarios.
- Se muestra un subconjunto acotado (60–100 Pokémon, Gen 1 por defecto) para mantener fluidez y evitar cientos de requests.

## 2. Alcance (MVP obligatorio)

### 2.1 Mapa interactivo navegable
- MapLibre GL JS con estilo vectorial de **OpenFreeMap** (sin API key).
- Vista inicial centrada en Argentina, con límites de navegación razonables (`maxBounds`).
- Marcadores personalizados: sprite del Pokémon + anillo con el color de su tipo principal.
- Selección → `flyTo` suave hacia el marcador (con offset para que no quede tapado por el panel).
- Opcional: dibujar las regiones como 
.

### 2.2 Consumo de PokéAPI y panel de detalle
- Endpoints: `GET /pokemon?limit=N` (lista) y `GET /pokemon/{id}` (detalle).
- Panel lateral (drawer) con: nombre, número, tipos, estadísticas base, sprite/artwork oficial, altura y peso.
- **Estados de carga:** skeletons que respetan el layout final del panel.
- **Estados de error:** mensaje claro + botón de reintentar; el mapa sigue usable.
- Caché de respuestas por id para no repetir requests al reseleccionar.

### 2.3 Animaciones con propósito
- **Marcadores tipo radar:** pulso concéntrico (utilidades de Tailwind + `@keyframes` en `globals.css`, color según tipo) que comunica "hay algo acá".
- **Drawer:** entrada/salida con Framer Motion (slide + fade), con `AnimatePresence`.
- **Barras de stats:** se llenan de 0 al valor base al abrir el panel (con *stagger*).
- **Cámara:** `flyTo` con easing, sin saltos bruscos.
- Respetar `prefers-reduced-motion` (desactivar pulso y reducir transiciones).

## 3. Sorpresas (Menú Creativo Abierto)

Solo después de cerrar el MVP (§2). Libertad total; estas son las ideas priorizadas y cómo encajan con la arquitectura actual.

### 3.1 Ya incorporado al mapa
- **Terreno 3D y cámara flotante:** relieve real (raster-dem Terrarium), sombreado, cielo/niebla, inclinación y deriva suave que se pausa al interactuar y respeta `prefers-reduced-motion`. Pendiente: pausar la deriva durante el `flyTo` a un marcador.
- **Carga progresiva de la lista:** primera página (20) en el servidor y el resto de a páginas vía `/api/pokemon?offset&limit` (tope 50 por request, solo Gen 1), sin bloquear la UI.

### 3.2 Sorpresas a incorporar
| Idea | Diseño propuesto | Dónde vive |
|---|---|---|
| 🌦️ **Clima en tiempo real** (Open-Meteo, sin API key) | El clima actual de cada región (lluvia → water/electric, nieve → ice, sol → fire, etc.) modula qué tipos aparecen **además** del bioma fijo de §1. Las posiciones siguen siendo deterministas (PRNG por id); solo cambia el *filtro de tipos activo*. | Fetch en servidor con revalidación corta (~30 min); resultado serializable al cliente. Fallback: sin clima → solo bioma. |
| 🗺️ **Biomas geográficos** | Además de las 6 regiones, hábitats puntuales (`cave`, `forest`, `mountain`, `sea`, `urban`) anclados a hitos: Glaciar Perito Moreno, Cataratas del Iguazú, Cordillera, Buenos Aires. Cada hito agrega tipos/Pokémon propios y un `flyTo` destacado. | `spawn.ts` (datos de hitos) + marcadores especiales. |
| 🔊 **Experiencia sonora** | Al seleccionar o "descubrir" un Pokémon se reproduce su grito (`cries.latest`, `.ogg`, viene en `GET /pokemon/{id}`). Solo tras interacción del usuario (política de autoplay), con botón de silencio y volumen bajo por defecto. | Cliente, dentro del drawer; `Audio` creado bajo demanda. |
| 🎒 **Equipo de Expedición** | Dock flotante con hasta 6 Pokémon "capturados". Capturar desde el drawer; quitar desde el dock; click en el dock hace `flyTo` al Pokémon. Persistencia en `localStorage` (leída tras hidratar, para evitar errores de hidratación). | Cliente: estado + `localStorage`; componente `expedition-dock.tsx`. |
| ⚡ **Filtros avanzados** | Filtrar por tipo, generación o rango de estadísticas, con microinteracciones (chips animados, marcadores que entran/salen con fade). Los marcadores filtrados se ocultan, no se recalculan posiciones. | Cliente; los stats requieren detalle, así que el rango de stats solo aplica a Pokémon con detalle ya cacheado (o se precarga bajo demanda). |

### 3.3 Otras ideas menores
- Buscador por nombre.
- Modo "radar" con barrido rotativo y radio alrededor del centro del mapa.
- Cadena evolutiva y habilidades en el detalle.
- Tema claro/oscuro.

### 3.4 Orden sugerido (impacto visual/UX vs. esfuerzo)
1. Equipo de Expedición y sonido (alto impacto, bajo riesgo, dependen del drawer de §8 fase 4).
2. Filtros avanzados.
3. Clima en tiempo real.
4. Biomas geográficos / hitos.

### 3.5 Riesgos a vigilar
- **Fluidez (25%):** terreno 3D + muchos marcadores DOM pueden pesar en móvil; medir antes de sumar más.
- **Determinismo:** el clima no debe romper la regla de posiciones estables (§1); solo filtra tipos.
- **Dependencias externas:** Open-Meteo y los sonidos necesitan estado de error/fallback silencioso, el mapa debe seguir usable.
- **Documentar en el README** qué se generó con IA y qué se revisó (criterio de §10).

## 4. Requisitos no funcionales
- **TypeScript estricto** (`strict: true`), sin `any` implícitos.
- **SSR:** el mapa depende de `window`; se carga con `next/dynamic` y `ssr: false`, siempre dentro de un Client Component (`"use client"`). En Server Components (`page.tsx`) `ssr: false` no está permitido, por eso existe `map-view-loader.tsx`. El criterio general de Server vs Client está en la sección 5.1.
- **Responsive (mobile, tablet y desktop):** obligatorio y de primera clase, no un "ajuste final". Los estilos se diseñan **mobile-first** con tamaños dinámicos por dispositivo; el detalle completo está en §4.1. En móvil el drawer pasa a *bottom sheet*.
- **Accesibilidad:** marcadores focuseables con teclado, `aria-label` con el nombre del Pokémon, panel con foco gestionado y cierre con `Esc`.
- **Performance:** lista inicial ligera, detalle bajo demanda, sprites con tamaño fijo para evitar layout shift.

## 4.1 Responsive: mobile, tablet y desktop

**Principio:** mobile-first. Los estilos base son los de móvil y se amplían con `min-width`. Ningún tamaño crítico se fija en `px` rígidos si puede escalar con el viewport. Toda pantalla se verifica en las tres clases de dispositivo.

### Breakpoints

| Clase | Ancho | Dispositivos de referencia | Layout |
|---|---|---|---|
| Mobile | `< 640px` (base) | 360×640, 390×844, 430×932 | Una sola columna; paneles como *bottom sheet*; controles apilados |
| Tablet | `640px – 1023px` | 768×1024, 820×1180, 1024×768 (landscape) | Paneles laterales parciales o sheet más ancho; controles agrupados en esquinas |
| Desktop | `≥ 1024px` | 1280×720, 1440×900, 1920×1080 | Drawer lateral derecho fijo; dock, filtros y minimapa en esquinas |

Se mapean a los prefijos de Tailwind y se declaran una sola vez en `@theme` (`--breakpoint-sm: 40rem` para tablet, `--breakpoint-lg: 64rem` para desktop; los valores por defecto de Tailwind ya coinciden: `sm` 640px, `lg` 1024px). **Mobile es el estilo sin prefijo**, tablet se activa con `sm:`/`md:` y desktop con `lg:`; no se escriben `@media` a mano si existe una utilidad equivalente. Se contempla también **orientación** (`landscape:`/`portrait:`) y **dispositivos táctiles** (variante `pointer-coarse:` o `@media (pointer: coarse)` vía `@custom-variant`) además del ancho. Para componentes que dependen de su contenedor y no del viewport (dock, paneles) se usan *container queries* (`@container`, `@sm:`, `@lg:`).

### Tamaños dinámicos

- **Tipografía y espaciado fluidos** con utilidades de Tailwind: valores arbitrarios con `clamp()` (ej. `text-[clamp(0.875rem,0.8rem+0.4vw,1.125rem)]`) o tokens propios declarados en `@theme` (ej. `--text-body`, `--spacing-panel`, `--size-marker`) que se redefinen por breakpoint. Los valores se declaran una vez en el tema y los componentes usan las utilidades, sin números mágicos repetidos.
- **Marcadores:** tamaño del sprite y del anillo/pulso radar definidos por variable (más chicos en móvil para no saturar el mapa, más grandes en desktop). El área táctil nunca baja de **44×44 px** aunque el sprite sea menor (padding o hit-area extendida).
- **Alturas con `dvh`/`svh`** en lugar de `vh`, para que la barra del navegador móvil no tape ni desborde el contenido: `h-dvh` en el contenedor del mapa y `max-h-[85dvh]` en el bottom sheet.
- **Safe areas:** respetar `env(safe-area-inset-*)` (notch, barra de gestos de iOS) en dock, bottom sheet y controles fijos, con valores arbitrarios (`pb-[max(1rem,env(safe-area-inset-bottom))]`); `viewport-fit=cover` en el viewport de `layout.tsx`.
- **Imágenes y sprites** con dimensiones declaradas (sin layout shift) y `sizes`/`srcset` o `next/image` cuando corresponda; el artwork del drawer escala con el contenedor.

### Comportamiento por componente

| Componente | Mobile | Tablet | Desktop |
|---|---|---|---|
| Panel de detalle (drawer) | *Bottom sheet*, alto máximo ~85dvh, con *handle* y gesto de arrastre/cierre | Sheet inferior más ancho y centrado, o panel lateral de ancho acotado | Drawer lateral derecho de ancho fijo/clamp |
| `flyTo` | Offset **vertical** (el marcador queda en la mitad visible sobre el sheet) | Offset según orientación (vertical en portrait, horizontal en landscape) | Offset **horizontal** (el marcador queda a la izquierda del drawer) |
| Equipo de Expedición (dock) | Barra inferior compacta, ítems en scroll horizontal si no entran; no tapa el sheet | Dock inferior centrado | Dock flotante con los 6 slots visibles |
| Filtros / buscador | Colapsados tras un botón; se abren como sheet o modal | Panel colapsable en una esquina | Panel visible en una esquina |
| Minimapa y overlay de radar | Minimapa reducido u oculto; el radar no compite con los controles | Minimapa chico | Minimapa completo |
| Compañero y *peek* de Pikachu | Reducidos y posicionados fuera de la zona de pulgar y del sheet | Tamaño intermedio | Tamaño completo |
| Modales (bienvenida, alertas) | Casi a pantalla completa, scroll interno, botones a ancho completo | Centrados con ancho máximo | Centrados con ancho máximo |
| Controles del mapa (zoom, sonido) | Esquinas fuera de la zona de pulgar y de la safe area | Esquinas estándar | Esquinas estándar |

### Detalles a tener en cuenta

- **Interacción táctil:** sin dependencia de `hover` (todo lo que se revela con hover tiene equivalente tap/foco); gestos del mapa (pellizcar, arrastrar) no deben chocar con el arrastre del bottom sheet; `touch-action` definido donde haga falta.
- **Teclado virtual y viewport dinámico:** inputs (buscador) no quedan tapados por el teclado en móvil.
- **Rendimiento en móvil:** terreno 3D, deriva de cámara y cantidad de marcadores DOM se degradan en pantallas chicas o dispositivos lentos (menos marcadores visibles por zoom/clustering, relieve más suave); medir antes de sumar más (ver §3.5).
- **Sin scroll horizontal** ni elementos cortados en ningún ancho entre 320px y 1920px; texto legible sin zoom (mínimo 16px en inputs para evitar el zoom automático de iOS).
- **Solapamientos:** dock, filtros, minimapa, compañero, sheet y modales no se pisan entre sí en ningún breakpoint; se define un orden de apilado (z-index) y zonas reservadas por pantalla.
- **Orientación:** probar portrait y landscape en móvil y tablet; el layout no se rompe al rotar con un panel abierto.
- **`prefers-reduced-motion`** y contraste (AA) se mantienen en todos los tamaños (variante `motion-reduce:` de Tailwind).
- **Convención Tailwind:** mobile-first sin prefijo, luego `sm:`/`md:`/`lg:`; las clases condicionales se componen con `cn()` y variantes con `cva`; los tamaños repetidos suben a tokens de `@theme`; solo se escribe CSS propio (en `globals.css`, dentro de `@layer`) para lo que Tailwind no cubre, como los `@keyframes` del pulso radar y los estilos de MapLibre.

### Cómo se verifica

- Revisión en DevTools con presets 360×640, 390×844, 768×1024, 1024×768, 1440×900 y en dispositivo real al menos para un móvil y una tablet.
- Cada fase de §8 incluye su chequeo responsive, no solo la fase 6.

## 5. Stack

| Área | Elección |
|---|---|
| Framework | Next.js 16.4.6 + React 19 |
| Lenguaje | TypeScript 5.9 |
| Mapa | `maplibre-gl` 6.x + OpenFreeMap (solo exports con nombre: `import { Map } from "maplibre-gl"`) |
| Animación | `framer-motion` + CSS |
| Estilos | **Tailwind CSS v4** en todo el proyecto (utilidades en `className`, tema en `@theme` dentro de `globals.css`). Sin CSS Modules ni CSS suelto por componente |
| Componentes UI | shadcn/ui (`src/components/ui`) con `class-variance-authority`, `clsx` y `tailwind-merge` (helper `cn`) |
| Datos | `fetch` + caché en memoria (hook propio) |
| Package manager | pnpm 9.14.4 |

> **Decisión tomada — Router:** se migró a **App Router** (`src/app`), alineado con el desafío y el tip del mapa. Next 16 tiene cambios respecto a lo habitual: antes de escribir código nuevo se consulta la guía correspondiente en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## 5.1 Criterios de renderizado: ¿Server o Client?

Cada componente y cada fetch debe tener una decisión explícita y justificada sobre dónde se ejecuta. No se marca `"use client"` "por las dudas", ni se evita por defecto.

### Reglas

1. **Server Component por defecto.** Se pasa a Client Component (`"use client"`) solo si el componente necesita al menos una de estas cosas:
   - estado o efectos (`useState`, `useEffect`, `useRef`);
   - eventos del usuario (click, teclado, hover);
   - APIs del navegador (`window`, `document`, WebGL, `matchMedia`);
   - librerías que dependen de lo anterior (MapLibre, Framer Motion).
2. **Fronteras de cliente lo más abajo posible.** `layout.tsx` y `page.tsx` siguen siendo Server Components; solo las "hojas" interactivas son cliente.
3. **Datos que no dependen de la interacción se piden en el servidor** (menos requests del navegador, sin waterfalls, datos listos en el primer render). Datos que nacen de una acción del usuario se piden en el cliente.
4. **Lo que cruza de server a client debe ser serializable** (objetos planos, sin funciones ni instancias).
5. **Sin no-determinismo en el render** (`Math.random()`, `Date.now()`): provoca errores de hidratación. Por eso el spawn usa un PRNG con semilla.
6. **Antes de implementar caché o revalidación, leer la guía de caching de esta versión** en `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`, porque las APIs de Next 16 pueden diferir de lo habitual.

### Decisión por pieza

| Pieza | Dónde | Justificación |
|---|---|---|
| `layout.tsx`, metadata | Server | Estático, sin interactividad, mejor SEO |
| `page.tsx` | Server | Orquesta y obtiene datos iniciales; no usa APIs del navegador |
| Lista inicial de Pokémon (60–100) y cálculo de spawn | Server | Datos públicos y estables de PokéAPI, sin `window`; resultado determinista, cacheable y compartido por todos los usuarios |
| `map-view-loader.tsx` | Client | Necesario para usar `dynamic` con `ssr: false` |
| `map-view.tsx` (MapLibre) | Client, **sin SSR** | Depende de `window` y WebGL; no puede renderizarse en servidor |
| `pokemon-marker.tsx` | Client | Eventos, animación CSS/Framer Motion, foco por teclado |
| `pokemon-drawer.tsx`, `stat-bar.tsx` | Client | Animaciones (Framer Motion), estado abierto/cerrado, `Esc` |
| Detalle de un Pokémon (`/pokemon/{id}`) | Client, bajo demanda | Depende de qué marcador elige el usuario; necesita estados de carga/error y caché en memoria |
| `type-badge.tsx`, `type-colors.ts` | Server o Client según quién lo importe | Componentes presentacionales sin estado: no llevan `"use client"` propio |

### Trade-offs a documentar

- **Mapa sin SSR:** el HTML inicial no contiene el mapa (se muestra un loader). Es inevitable y aceptable: el mapa no es contenido indexable.
- **Datos iniciales en servidor:** mejoran el tiempo hasta ver marcadores, pero acoplan el primer render a la disponibilidad de PokéAPI. Debe haber un estado de error si falla.
- **Cada decisión relevante de SSR/CSR queda explicada en el README** (sección "Decisiones de renderizado").

## 6. Estructura propuesta

```
src/
  app/
    layout.tsx              # [hecho] root layout, metadata, lang="es"
    page.tsx                # [hecho] renderiza MapViewLoader
    globals.css             # [hecho] `@import "tailwindcss"`, `@theme` (tokens, breakpoints), keyframes del radar, tema oscuro
  components/
    map/
      map-view-loader.tsx   # [hecho] Client Component: dynamic + ssr:false
      map-view.tsx          # [hecho base] instancia MapLibre; falta flyTo y capas de regiones
      pokemon-marker.tsx    # marcador DOM con sprite + pulso radar
    pokemon/
      pokemon-drawer.tsx    # panel de detalle (Framer Motion)
      pokemon-skeleton.tsx
      stat-bar.tsx
      type-badge.tsx
  lib/
    pokeapi.ts              # fetchers tipados
    spawn.ts                # regiones, biomas, PRNG determinista
    type-colors.ts
  types/
    pokemon.ts
  hooks/
    use-pokemon.ts          # fetch + caché + estados loading/error
```

## 7. Modelo de datos (resumen)

```ts
type PokemonType = "normal" | "fire" | "water" | /* ... */ "fairy";

interface Region {
  id: string;
  name: string;
  biome: string;
  bounds: [west: number, south: number, east: number, north: number];
  types: PokemonType[];
}

interface SpawnedPokemon {
  id: number;
  name: string;
  types: PokemonType[];
  regionId: string;
  coordinates: [lng: number, lat: number];
}

interface PokemonDetail extends SpawnedPokemon {
  sprite: string;
  stats: { name: string; base: number }[];
  height: number;
  weight: number;
}
```

## 8. Fases de implementación

1. **Base — HECHO:** TypeScript 5.9, `maplibre-gl` y `framer-motion` instalados, migración a App Router, layout y página.
2. **Mapa — HECHO (base):** `MapView` con `dynamic`/`ssr:false`, estilo OpenFreeMap, cámara inicial sobre Argentina con `maxBounds`. Pendiente: capas de regiones (opcional) y verificación visual en navegador.
3. **Spawn:** `spawn.ts` con regiones y PRNG determinista; renderizado de marcadores con sprites.
4. **Detalle:** `pokeapi.ts`, hook con caché, drawer con skeletons y estado de error.
5. **Animaciones:** pulso radar, transiciones del drawer, barras de stats, `flyTo`, reduced-motion.
6. **Pulido:** responsive completo (mobile, tablet, desktop según §4.1), accesibilidad, README con las decisiones de diseño. Nota: el responsive se aplica desde la fase 2 en adelante en cada componente; esta fase solo lo audita y corrige.

## 9. Criterios de aceptación

- [ ] El mapa carga sin errores `window is not defined`.
- [ ] Los Pokémon aparecen en la misma posición tras recargar.
- [ ] Un Pokémon de tipo hielo aparece en Patagonia y no en el NEA.
- [ ] Al clickear un marcador la cámara vuela suavemente y el panel se abre.
- [ ] El panel muestra skeleton mientras carga y mensaje de error con reintento si falla la red.
- [ ] Las barras de stats se animan al abrir el panel.
- [ ] Funciona en móvil y con `prefers-reduced-motion` activo.
- [ ] Mobile (360–430px), tablet (768–1024px, portrait y landscape) y desktop (≥1280px) se ven correctos: sin scroll horizontal, sin solapamiento entre paneles y con áreas táctiles ≥ 44px.
- [ ] Todo el estilado usa Tailwind (sin CSS Modules ni estilos inline salvo valores dinámicos como el color de tipo).
- [ ] Tamaños fluidos (`clamp`/tokens de `@theme`) y alturas con `dvh`; respeta safe areas en dispositivos con notch.
- [ ] El `flyTo` deja el marcador visible según el layout del dispositivo (offset vertical en bottom sheet, horizontal en drawer lateral).
- [ ] `pnpm build` y `pnpm lint` pasan sin errores.

## 10. Criterios de evaluación y ponderación

Estos criterios aplican a **toda la app** y guían cada decisión de diseño e implementación. Ante un trade-off, se prioriza según el peso.

| Criterio | Peso | Qué observamos |
|---|---|---|
| Sensibilidad visual, UX y creatividad | 35% | Buen gusto estético, diseño responsive (mobile, tablet y desktop), coherencia de diseño y originalidad. |
| Fluidez del mapa e interacciones | 25% | Navegación suave, animaciones con sentido, transiciones de cámara sin bloqueos. |
| Calidad de código y arquitectura Next.js | 25% | Código limpio, TypeScript estricto (sin `any`), separación clara Server vs Client Components. |
| Criterio de uso de IA y documentación | 15% | Honestidad, espíritu crítico para auditar código generado por IA y claridad del README. |

### Cómo se traduce en el proyecto

- **Visual/UX (35%):** identidad visual propia y consistente (paleta por tipo, tipografía, espaciado), bottom sheet en móvil, estados de carga/error cuidados, detalles que sorprendan sin recargar la interfaz.
- **Mapa (25%):** `flyTo` con easing y offset, sin bloqueos del hilo principal (marcadores livianos, sprites de tamaño fijo, detalle bajo demanda), animaciones que comunican algo (radar, stats) y respetan `prefers-reduced-motion`.
- **Código (25%):** `strict: true` sin `any` ni casts evitables; Server Components por defecto y `"use client"` solo donde hace falta (mapa, drawer, hooks); módulos pequeños y tipados (`lib/`, `hooks/`, `types/`).
- **IA y documentación (15%):** el README documenta qué se generó con IA, qué se revisó/corrigió y por qué se tomaron las decisiones (ej. spawn determinista, App Router, `ssr: false`), incluyendo limitaciones conocidas con honestidad.
