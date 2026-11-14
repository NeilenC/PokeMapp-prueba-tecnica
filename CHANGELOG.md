# Changelog — PokeMapp

Registro de lo hecho, en orden cronológico inverso.

## Panel de tipos con componentes de shadcn

- Se agregaron `tabs`, `toggle-group`, `badge`, `button`, `scroll-area` y `tooltip` (`src/components/ui/`). La CLI importó `cn` desde un paquete npm homónimo en vez de `@/lib/utils`: se corrigieron los imports y se quitó la dependencia.
- [globals.css](src/app/globals.css): se completaron los tokens que esperan los componentes (`muted`, `accent`, `input`, `primary`, `destructive`) con la paleta oscura del proyecto.
- [filters-panel.tsx](src/components/map/filters-panel.tsx): tipos como `ToggleGroup` en grilla de 4 columnas (barra lateral con el color del tipo, fondo lleno al activarse) en lugar de píldoras; Todos/Tengo/Faltan como `Tabs` con `Badge` (antes "Descubiertos" se partía en dos líneas); "Limpiar filtros" pasó a un botón chico en el encabezado, visible solo con filtros activos; `ScrollArea` en vez de la barra nativa; `Tooltip` en estrella y pin (también cuando la estrella está deshabilitada).

## Equipo de expedición

- [team-store.ts](src/lib/team-store.ts): hasta 6 favoritos en orden de incorporación, persistidos en `localStorage` (`pokemapp:team:v1`) con el mismo patrón que `discovered-store` (`useSyncExternalStore`, lectura solo en cliente, sin errores si el storage está bloqueado).
- [expedition-dock.tsx](src/components/map/expedition-dock.tsx): dock abajo al centro con los 6 espacios. Click en un Pokémon = abrir detalle, volar hasta él y su grito; la "x" lo quita. Se centra en el espacio libre cuando el panel de detalle está abierto y se oculta en móvil mientras lo está.
- **Compañero activo** (`pokemapp:companion:v1`): uno del equipo, elegido con el corazón del dock (el primero que se suma lo es por defecto; al quitarlo del equipo se libera). [companion.tsx](src/components/map/companion.tsx) lo dibuja abajo a la derecha, a la izquierda del minimapa (160 px, con sombra, de espaldas espejado para que mire a la izquierda; de frente ya mira hacia allá), sin interceptar clicks y siguiendo al minimapa cuando se abre el panel de detalle. Usa el sprite animado de PokéAPI (`other/showdown`): **de frente** con el mapa quieto y **de espaldas** mientras la cámara se mueve. Las dos vistas quedan montadas y solo se alterna cuál se ve, para que el giro sea instantáneo; si un GIF falla cae al sprite estático. "Moviéndose" se calcula en `map-view` con el evento `move` e ignora la deriva automática (que casi siempre está activa y lo dejaría siempre de espaldas); vuelve a "quieto" tras 600 ms sin movimiento. Al descubrir da un salto y suena su grito: uno por tanda, como mucho cada 1,5 s y sin cortar otro grito que ya esté sonando (`isCryPlaying`). Con `prefers-reduced-motion` usa sprites estáticos y no salta.
- [sound-toggle.tsx](src/components/map/sound-toggle.tsx): botón de silencio junto al de Pokédex; el estado vive en [cry.ts](src/lib/cry.ts) (`useSyncExternalStore`) y se guarda en `localStorage` (`pokemapp:muted:v1`). Silenciar corta el grito que esté sonando.
- Se agrega/quita con la estrella en la lista por tipo y con el botón del panel de detalle. Solo se pueden sumar descubiertos; con el equipo lleno los botones de agregar se deshabilitan.

## Minimapa, gritos y explorador por tipo

- [mini-map.tsx](src/components/map/mini-map.tsx): minimapa plano de Argentina abajo a la derecha, con el área visible del mapa principal (recuadro) y un punto en el centro de la cámara. Segundo `Map` de MapLibre, no interactivo; el click lleva la cámara principal hasta ese punto. El borde superior del recuadro se toma al 40 % de la altura porque con pitch alto la parte de arriba es cielo y `unproject` da valores absurdos. Se corre a la izquierda del panel de detalle y se oculta en móvil mientras está abierto.
- [cry.ts](src/lib/cry.ts): grito del Pokémon (`PokeAPI/cries`, variante `legacy`) **solo al seleccionarlo**, no al descubrirlo: el radar suele revelar varios a la vez y sonarían todos juntos. Un único `Audio` compartido, así que un grito corta al anterior. Errores de reproducción ignorados. `setCriesMuted` queda listo para el futuro menú.
- [filters-panel.tsx](src/components/map/filters-panel.tsx) + [filters.ts](src/lib/filters.ts): panel lateral "Pokémon por tipo". Lista agrupada por tipo (un Pokémon de dos tipos aparece en ambas secciones) con sprite, nombre y contador descubiertos/total. Click en la fila = grito; el pin abre el detalle y vuela hasta el Pokémon. Selector Todos / Descubiertos / Faltan con contadores ajustados al tipo elegido.
- Los chips de tipo también apagan los marcadores **descubiertos** del mapa (`is-filtered-out`). Las siluetas no se filtran ni se nombran en la lista (`???`), para que el filtro no delate su tipo.
- Decisiones: sin filtro por generación (la app es solo Gen 1) y sin filtro por stats (se probó y no se entendía; se quitó junto con sus 151 requests extra).
- Pendiente: botón de silencio, equipo de expedición, y revisar si los gritos `legacy` existen para los 151.

## Descubrimiento con radar y Pokédex

- Los Pokémon arrancan como **siluetas** (sin pulso, no clickeables: el click pasa al mapa) y se revelan al ser descubiertos. Solo los descubiertos se pueden abrir.
- [radar-overlay.tsx](src/components/map/radar-overlay.tsx): radar HUD en el centro de la pantalla (diámetro `clamp(220px, 56vmin, 440px)`). Un haz gira cada 6 s; cuando cruza un Pokémon dentro del círculo lo descubre. El ángulo se escribe por DOM en un `requestAnimationFrame` (sin re-render) y es el mismo que decide el descubrimiento, así haz y lógica no se desfasan. Tope de 40°/frame para que, tras una pestaña en segundo plano, no se revele todo de golpe. La deriva de cámara hace que el radar descubra mientras el mapa "planea".
- **El radar depende del zoom:** con el círculo de tamaño fijo en pantalla, alejado cubría medio país y se descubría casi todo de golpe. Ahora aparece con un fundido entre zoom 6 y 6,5 (`RADAR_FADE_START_ZOOM` / `RADAR_MIN_ZOOM`) y **solo descubre desde 6,5** (donde abarca unos 150–200 km). Alejado no se ve ni revela nada.
- [discovered-store.ts](src/lib/discovered-store.ts): almacén externo para `useSyncExternalStore`, persistido en `localStorage` (`pokemapp:discovered:v1`) y leído solo en el cliente. Si el storage está bloqueado, el descubrimiento sigue en memoria.
- [pokedex-hud.tsx](src/components/map/pokedex-hud.tsx): contador "POKÉDEX n / 151" con barra de progreso y aviso animado (Framer Motion) al descubrir; región `aria-live` para lectores de pantalla.
- [pokemon-markers.tsx](src/components/map/pokemon-markers.tsx) + [globals.css](src/app/globals.css): animación de revelado (destello en `box-shadow` y "pop" en la imagen; no se anima `transform` del marcador porque MapLibre lo usa para posicionarlo). No se anima al restaurar lo guardado. Marcadores sin descubrir con `aria-hidden` y `disabled`.
- `prefers-reduced-motion`: sin haz ni animaciones; todo lo que entra al círculo se revela directo.
- Se quitó un `console.log` de depuración que quedaba en `createMarkerElement`.
- Limitación conocida: una persona que navega solo con teclado no puede descubrir (el radar es visual, solo se mueve con el mapa); falta una alternativa accesible.

## Estadísticas base con barras animadas

- `PokemonDetail.stats` ([pokemon.ts](src/types/pokemon.ts)): las 6 stats base traducidas (PS, Ataque, Defensa, At. esp., Def. esp., Velocidad), armadas en `fetchPokemonDetail` ([pokeapi.ts](src/lib/pokeapi.ts)) desde el mismo `/pokemon/{id}` (sin requests extra).
- [stat-bar.tsx](src/components/pokemon/stat-bar.tsx): barra con Framer Motion que se llena de 0 al valor (`scaleX`, compositor, sin relayout), escalonada 70 ms entre barras. Con `prefers-reduced-motion` aparece ya llena. Escala visual con tope en 200 (el máximo real es 255, pero casi todo queda entre 40 y 130).
- [pokemon-sheet.tsx](src/components/pokemon/pokemon-sheet.tsx): sección "Estadísticas base" con total; `key={id}` para que las barras vuelvan a llenarse al cambiar de Pokémon. Lista `ul/li` accesible (el número es texto; la barra es decorativa).
- [pokemon-skeleton.tsx](src/components/pokemon/pokemon-skeleton.tsx): 6 barras de relleno para respetar el layout final.

## Estilo del mapa y zonas visibles

- [lib/map-theme.ts](src/lib/map-theme.ts): paleta propia (tierra cálida, agua y vegetación más saturadas) aplicada con `setPaintProperty` sobre el estilo `liberty`; ignora capas que falten.
- [lib/map-zones.ts](src/lib/map-zones.ts): las 40 zonas de spawn como halos del color del bioma (bajo el relieve, más tenues al acercarse), contorno punteado y nombre del lugar desde zoom 5,5. El contorno usa la misma fórmula que `spawnPosition`, así coincide con donde caen los marcadores.

- [lib/map-mask.ts](src/lib/map-mask.ts) + [public/geo/neighbors.geojson](public/geo/neighbors.geojson) (Natural Earth 10m simplificado, ~300 KB): máscara oscura al 45 % solo sobre la tierra de Chile, Bolivia, Perú, Brasil, Uruguay y Paraguay. El mar y Malvinas no se tocan (con un contorno grueso la costa quedaba cortada con líneas rectas). Las etiquetas quedan por encima.

- [lib/map-labels.ts](src/lib/map-labels.ts): las etiquetas con "Falkland" o "Malvinas" se muestran como "Malvinas Argentinas" (se envuelve el `text-field` de las capas de texto).

## Marcadores y panel de detalle

- `GET /api/pokemon/[id]` ([route.ts](src/app/api/pokemon/[id]/route.ts)): tipos, altura, peso, artwork y descripción (español, con fallback a inglés).
- La lista trae `spriteUrl` armado desde el id (sin requests extra).
- [lib/spawn.ts](src/lib/spawn.ts): posición determinista por id (PRNG con semilla). Provisorio: recuadro sobre Argentina, sin biomas todavía.
- [pokemon-markers.tsx](src/components/map/pokemon-markers.tsx): un marcador DOM por Pokémon (sprite + pulso radar), accesible por teclado.
- Tailwind v4 + shadcn/ui ([components.json](components.json)). Se reemplazó el CSS a mano del panel por utilidades de Tailwind.
- [pokemon-sheet.tsx](src/components/pokemon/pokemon-sheet.tsx) sobre el `Sheet` de shadcn ([ui/sheet.tsx](src/components/ui/sheet.tsx)), no modal (sin overlay, el mapa sigue usable), con `type-badge` y `pokemon-skeleton`: skeleton, error con reintento, cierre con Esc y colores del tipo principal. Bottom sheet en móvil.
- [hooks/use-pokemon-detail.ts](src/hooks/use-pokemon-detail.ts): fetch bajo demanda con caché en memoria por id.
- [lib/type-colors.ts](src/lib/type-colors.ts): color y nombre en español de cada tipo.
- Al elegir un marcador, `flyTo` con offset para que el panel no lo tape.

## Gestos de cámara (mapa)

Implementados en [src/components/map/map-view.tsx](src/components/map/map-view.tsx).

| Gesto | Efecto | Notas |
|---|---|---|
| Dos dedos deslizando (trackpad) | Desplaza la cámara (`panBy`, 1:1) | Se detecta por deltas chicos/continuos o con `deltaX`. |
| Pellizco (trackpad) | Zoom con inercia | Llega como `wheel` con `ctrlKey`; 1/100 niveles por px. |
| Rueda de mouse | Zoom con inercia | Deltas grandes y enteros (~100); 1/300 niveles por px (~0.33 por click). |
| Alt + dos dedos (o Alt + rueda) | Horizontal rota, vertical inclina | 0.3°/px de rumbo, 0.2°/px de inclinación; inclinación limitada a `[0, maxPitch=75]`. Funciona en cualquier sistema. |
| Giro con dos dedos (trackpad) | Rota la cámara siguiendo los dedos | **Solo Safari/macOS** (eventos `gesturestart`/`gesturechange`). Windows no expone el giro del trackpad a los navegadores. |
| Arrastrar / tocar | Navegación estándar de MapLibre | Pantallas táctiles rotan con dos dedos de forma nativa. |

Detalles de implementación:
- La clasificación trackpad vs. mouse es heurística y se "traba" 250 ms para que un gesto no cambie de modo a mitad. Un scroll de trackpad muy brusco podría tomarse como rueda y hacer zoom un instante. Umbral ajustable (`Math.abs(deltaY) < 50`).
- Los handlers se registran en fase de captura sobre el contenedor del canvas y llaman a `stopPropagation` para que el `scrollZoom` de MapLibre no los procese.
- **Zoom con inercia:** se desactivó `scrollZoom` de MapLibre y se reemplazó por un zoom propio. Cada evento mueve un zoom *objetivo* (acotado a `minZoom`/`maxZoom`) y un bucle `requestAnimationFrame` lo persigue con desaceleración exponencial (`ZOOM_SMOOTH_MS = 140`, independiente de los FPS, `dt` limitado a 50 ms). El punto bajo el cursor se mantiene fijo (`around`). Con `prefers-reduced-motion` el zoom es inmediato. Para más/menos deslizamiento al frenar, subir/bajar `ZOOM_SMOOTH_MS`.
- Todo gesto del usuario pausa la deriva automática de la cámara; se reanuda tras 8 s de calma.

## Cámara flotante y terreno 3D

- Terreno 3D con raster-dem Terrarium (AWS, sin API key), exageración 1.6, y capa `hillshade` debajo de las etiquetas.
- Cielo y niebla con `setSky`; inclinación inicial 60° (máx. 75°); brújula visible.
- Deriva suave: rumbo +25° cada 20 s, lineal y encadenada. Se desactiva con `prefers-reduced-motion`.
- Pendiente: pausar la deriva durante el `flyTo` a un marcador.

## PokéAPI con carga progresiva

- `GET /api/pokemon?offset&limit` ([route.ts](src/app/api/pokemon/route.ts)): valida parámetros (400), tope de 50 por request, solo Gen 1 (151), 502 si PokéAPI falla.
- [lib/pokeapi.ts](src/lib/pokeapi.ts): fetch tipado y paginado, caché de 1 día (modelo previo de caching; `cacheComponents` no está activado).
- [page.tsx](src/app/page.tsx): pide la primera página (20) en el servidor; si falla, el cliente arranca desde cero.
- [hooks/use-pokemon-list.ts](src/hooks/use-pokemon-list.ts): trae el resto de a páginas con 250 ms de pausa, aborta al desmontar, con error y reintento.
- Indicador provisorio de progreso en el mapa ("Pokémon: N / 151").

## Especificación

- [SPEC.md](SPEC.md) §3: sorpresas del Menú Creativo Abierto (clima Open-Meteo, biomas/hitos, sonido, Equipo de Expedición, filtros avanzados), con diseño, orden sugerido y riesgos.
