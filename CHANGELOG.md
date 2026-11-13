# Changelog — PokeMapp

Registro de lo hecho, en orden cronológico inverso.

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
