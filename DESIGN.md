# DESIGN.md — Cinta · Mi año en cine

Sistema de diseño de la app, escrito para el agente. Léelo antes de crear o modificar cualquier archivo en
`src/screens/` o `src/components/`.

- **Fuente de verdad visual:** `docs/diseno/brand-board.html` (brand board v3, 21/11/2026), que sale de
  `docs/diseno/BRIEF.md`.
- **Si este archivo y el board no coinciden, manda el board.** Avisa de la diferencia en lugar de elegir.
- **No modifiques este archivo por iniciativa propia** (AGENTS.md).

## 1. Principios

La app es **íntima, editorial y enérgica**, y al ver su año el usuario siente **orgullo**.

| Principio | Reglas para cada pantalla                                                                                                                                                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Íntima    | Se habla de tú, como una amiga que también ve cine. Nada se comparte por defecto: sin rankings, sin comparar con otras personas. La atribución de TMDB siempre es menos prominente que la marca Cinta.                                                            |
| Editorial | Un dato grande por tarjeta y una idea a la vez. Títulos con peso (`display`, `titulo`). Mucho aire: 12 entre tarjetas y 20 de margen lateral. Nada de tableros llenos de gráficas pequeñas.                                                                       |
| Enérgica  | Un solo acento (`acento`, verde lima sobre negro) para lo importante: la acción principal, el dato destacado, la pestaña activa y el mes top. Los números son protagonistas. Transiciones cortas y que se pueden quitar.                                          |
| Orgullo   | En "Mi año en cine", los números (obras, horas) se muestran grandes, como titulares. La obra destacada se presenta como una "portada", con su póster y su calificación. Los textos celebran sin exagerar. Un año vacío o incompleto no da culpa: invita a seguir. |

## 2. Tokens

**Dónde viven:** en `src/tema/`, la única fuente de verdad de colores, espacios y tamaños. Se usan con `useTema()`
(`color`, `texto`, `escala`, `estado`), más `radio`, `MARGEN`, `TOQUE`, `espacio` y `EFECTOS`. Fuera de
`src/tema/` no se escribe ningún valor fijo. Los nombres son los mismos que usa el board.

### Paleta

| Token                     | Normal                      | Alto contraste              | Uso                                                    |
| ------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------ |
| `fondo`                   | `#0A0A0A`                   | `#000000`                   | Fondo de pantalla                                      |
| `superficie`              | `#131313`                   | `#0D0D0D`                   | Tarjetas                                               |
| `superficieAlta`          | `#1B1B1B`                   | `#1F1F1F`                   | Campos, segmentos, póster vacío                        |
| `borde`                   | `#262626`                   | `#6B6B66`                   | Bordes y separadores                                   |
| `texto`                   | `#F4F4F1`                   | `#F4F4F1`                   | Títulos y datos                                        |
| `textoSecundario`         | `#A3A3A0`                   | `#E6E6E2`                   | Texto de apoyo                                         |
| `textoTenue`              | `#8A8A86`                   | `#CFCFCA`                   | Metadatos, placeholder, atribución                     |
| `estrellaVacia`           | `#4A4A47`                   | `#8A8A86`                   | Estrellas sin llenar (no es texto)                     |
| `acento`                  | `#D4FF3A`                   | `#D4FF3A`                   | Acción principal, dato destacado, pestaña activa       |
| `sobreAcento`             | `#0A0A0A`                   | `#0A0A0A`                   | Texto sobre acento                                     |
| `acentoSuave`             | `rgba(212, 255, 58, 0.12)`  | `rgba(212, 255, 58, 0.22)`  | Fondos suaves, avisos, "viendo"                        |
| `peligro`                 | `#FF7A6B`                   | `#FF9C90`                   | Error, quitar de la lista                              |
| `peligroSuave` _(nuevo)_  | `rgba(255, 122, 107, 0.12)` | `rgba(255, 156, 144, 0.16)` | Fondo de avisos y estados de error                     |
| `barraInactiva` _(nuevo)_ | `#3A3D2E`                   | `#5A5E47`                   | Barras de meses que no son el más activo (no es texto) |
| `velo`                    | `rgba(10, 10, 10, 0.62)`    | `rgba(0, 0, 0, 0.85)`       | Controles sobre imágenes                               |

### Colores de estado y de error (nuevos como tokens)

Hasta ahora se armaban dentro del componente; pasan a ser tokens propios para que todas las pantallas los usen
igual.

| Token          | Fondo                                | Texto             | Contraste (alto contraste)         |
| -------------- | ------------------------------------ | ----------------- | ---------------------------------- |
| `estadoVista`  | `acento`                             | `sobreAcento`     | 17,1 : 1 (17,1)                    |
| `estadoViendo` | `acentoSuave`                        | `acento`          | 11,9 : 1 (9,2)                     |
| `estadoPorVer` | `superficieAlta` (con borde `borde`) | `textoSecundario` | 6,8 : 1 (13,2)                     |
| `error`        | `peligroSuave`                       | `peligro`         | 6,2 : 1 · texto blanco encima 14,2 |

### Efectos (nuevos como tokens)

Transparencias y degradados que no son colores de la paleta. Viven en `EFECTOS` (`src/tema/`), son iguales en alto
contraste y tienen los valores que ya usaba la app. No están en el board: los aprobó la usuaria el 21/11/2026.

| Token               | Valor                                                                                   | Uso                                           |
| ------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| `contornoAcento`    | `rgba(212, 255, 58, 0.4)`                                                               | Borde de la etiqueta "contorno" sobre pósters |
| `brilloAcento`      | `0px 8px 24px rgba(212, 255, 58, 0.22)`                                                 | Sombra del botón primario                     |
| `degradado.hero`    | `rgba(10, 10, 10, 0.5)` 0 % → `rgba(10, 10, 10, 0.2)` 45 % → `fondo` 100 %              | Velo de la foto de portada (Login)            |
| `degradado.poster`  | `rgba(10,10,10,0.35)` 0 % → `rgba(10,10,10,0)` 30 % y 65 % → `rgba(10,10,10,0.8)` 100 % | Velo de los pósters en Buscar                 |
| `degradado.portada` | `rgba(10,10,10,0.15)` 0 % → `rgba(10,10,10,0.7)` 100 %                                  | Velo de la portada en Editar                  |

### Tipografía

Fuente del sistema (San Francisco en iOS, Roboto en Android). Lo editorial sale de los pesos y tamaños, no de una
fuente especial. **Todos los tamaños se multiplican por la escala de texto** (1, 1,15 o 1,3).

| Token            | Tamaño / peso | Detalles                                     | Uso                                  |
| ---------------- | ------------- | -------------------------------------------- | ------------------------------------ |
| `dato` _(nuevo)_ | 48 / 800      | Cifras tabulares · espaciado −1,5 · línea 1  | Número grande de una tarjeta de dato |
| `display`        | 32 / 800      | Espaciado −0,8                               | Título de pantalla                   |
| `titulo`         | 22 / 700      | Espaciado −0,3                               | Título de obra destacada, secciones  |
| `subtitulo`      | 16 / 600      |                                              | Títulos de tarjeta, botones de lista |
| `cuerpo`         | 15 / 400      | Línea 22 · color `textoSecundario`           | Párrafos y mensajes                  |
| `pequeno`        | 13 / 400      | Línea 18 · color `textoSecundario`           | Apoyo de un dato, metadatos          |
| `etiqueta`       | 11 / 700      | Mayúsculas · espaciado +1,1 · color `acento` | Rótulo de tarjeta                    |

Los decimales se escriben con coma: **48,5 h**.

### Espacios

| Token        | Valor |
| ------------ | ----- |
| `esp-xs`     | 4     |
| `esp-s`      | 8     |
| `esp-m`      | 12    |
| `esp-l`      | 16    |
| `esp-margen` | 20    |
| `esp-xl`     | 24    |
| `esp-xxl`    | 32    |

Entre tarjetas: 12. Margen lateral de pantalla: 20. Dentro de una tarjeta de dato: 18. Separación entre
tocables: 8.

### Radios

| Token | Valor | Uso                              |
| ----- | ----- | -------------------------------- |
| `s`   | 10    | Póster y avisos pequeños         |
| `m`   | 14    | Botones, campos, tarjeta de obra |
| `l`   | 20    | Tarjetas del resumen             |

### Área táctil

`toque` = 44 × 44 mínimo, aunque el ícono mida 20. Botones grandes: 52 de alto.

## 3. Componentes

La pantalla "Mi año en cine" se arma **solo** con estos componentes.

### Marca

- **Logotipo:** cuadrado `acento` con radio 58/256, "C" de trazo grueso abierta a la derecha (la cinta que se
  enrolla) y punto central (el proyector). Se conserva el de `assets/logo.svg`.
- **Wordmark:** "Cinta" en fuente del sistema, peso 800, con el punto final en `acento`.
- **Tamaños:** ícono de la app 1024 px; login / splash 88 px + wordmark 56; cabecera de Perfil 32 px (solo
  logotipo). Área de respeto alrededor del logotipo: un cuarto de su ancho.
- **Atribución de TMDB (obligatoria):** logo de TMDB a 10–12 px de alto y el texto "This product uses the TMDB API
  but is not endorsed or certified by TMDB." en `textoTenue` 11 px. Nunca en `acento` ni junto al logotipo de
  Cinta.

### Se conservan del Proyecto 3

| Componente         | Tokens y medidas                                                                                                                                                                                                                          | Accesibilidad                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Tarjeta de obra    | Fondo `superficie`, borde `borde`, radio `m`, relleno 12, separación 12. Póster 56 × 84 con radio `s`. Título 16/600; metadato ("Película · 2024") 13 en `textoTenue`                                                                     | Si se toca, toda la tarjeta es un solo botón con el título como etiqueta            |
| Póster vacío       | Fondo `superficieAlta`, texto "Sin póster" en `textoTenue` 600                                                                                                                                                                            |                                                                                     |
| Etiqueta de estado | Alto mínimo 24, relleno horizontal 10, radio completo, 12/700. Colores de `estadoVista`, `estadoViendo` y `estadoPorVer`                                                                                                                  | No es tocable                                                                       |
| Selector de estado | Contenedor `superficieAlta` con borde, radio `m`, relleno 4, separación 4. Cada opción: alto 44, radio `s`, 600/14 en `textoSecundario`; la activa en `acento` con texto `sobreAcento`                                                    | Grupo de opciones (radiogroup) con la opción seleccionada indicada                  |
| Estrellas          | Llena en `acento`, vacía en `estrellaVacia`. Para mostrar: 18 px con separación 2                                                                                                                                                         | Etiqueta "4 de 5 estrellas". Para calificar, cada estrella tocable mide al menos 44 |
| Botón              | Alto 52, radio `m`, relleno horizontal 20, 700/16. **Primario:** `acento` + `sobreAcento`. **Secundario:** `superficieAlta` + `texto` con borde. **Peligro:** transparente, texto y borde `peligro`. **Pequeño:** alto 44, 14, relleno 16 | Etiqueta con la acción ("Ir a Mi lista", no "Haz clic aquí")                        |
| Chip de filtro     | Alto 44, relleno horizontal 16, radio completo, borde `borde`, fondo `superficie`, 600/14 en `textoSecundario`. Activo: fondo y borde `acento`, texto `sobreAcento`                                                                       | Estado seleccionado indicado                                                        |
| Aviso              | Fondo `acentoSuave`, radio `m`, relleno 12/14, 13 en `texto`, ícono en `acento`. Variante error: fondo `peligroSuave`, ícono en `peligro`                                                                                                 | Texto completo legible por el lector de pantalla                                    |

### Nuevos de la épica

| Componente         | Tokens y medidas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Accesibilidad                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tarjeta de dato    | Fondo `superficie`, borde `borde`, radio `l`, relleno 18. Rótulo `etiqueta` con 10 debajo. **Número:** `dato` (48/800, −1,5, línea 1, cifras tabulares); unidad ("h") 20/700, −0,3, a 2 del número, en `textoSecundario`. **Texto** (género, director): 26/800, −0,5, línea 1,1. **Apoyo:** 13 en `textoSecundario`, 8 arriba. **Dato faltante:** 12 en `textoTenue`, 10 arriba, con ícono ⓘ. **Compacta** (solo cuando van dos por fila en la pantalla): número 40, texto 22, relleno 14 vertical y 16 horizontal. "Obras vistas", que va sola y a todo el ancho, usa la variante normal (número 48). **Sin datos** (director o destacada): el valor de texto va en `textoSecundario`                                                                                                                                            | Toda la tarjeta se lee como una sola frase: rótulo, valor y apoyo                                                                                  |
| Barras por mes     | Tarjeta `superficie` con borde, radio `l`, relleno 18. Cabecera: "Tu año mes a mes" 15/600 y "Pico: <mes>" en `pequeno`, 16 debajo. Área: alto 120 en el board, **96 dentro de la pantalla**, separación 6 entre columnas. **12 barras siempre**, también con 0 (línea mínima de 3 px). Alto proporcional al mes máximo. Barra en `barraInactiva` con radio 6 arriba y 3 abajo; la del mes top en `acento` con su cifra encima (11/700 en `acento`). Inicial del mes debajo (E F M A M J J A S O N D), 11/600 en `textoTenue`; la del mes top en `acento`. **Se construyen con `View`**, sin librerías de gráficas. **Animación:** al abrir la pantalla o cambiar de año, crecen desde 0 hasta su alto en 300 ms con `Animated` de React Native (sin librerías nuevas); con "reducir movimiento" aparecen directamente en su alto | La tarjeta entera lleva **una** etiqueta con los 12 valores: "Obras vistas por mes: enero 2, febrero 3, marzo 4, …". Las barras sueltas no se leen |
| Obra destacada     | Tarjeta `superficie` con borde, radio `l`, contenido recortado al borde. Póster de portada: alto 190 en el board, **140 dentro de la pantalla**, sin radio propio, relleno 16, con el título encima en 22/800, −0,4, en 2 líneas como máximo y cortado con "…". Cuerpo con relleno 16 arriba y 18 a los lados y abajo: rótulo "Tu mejor calificada del año", estrellas (8 arriba) y "Película · vista el 12 de octubre" en 13 `textoSecundario` (6 arriba). Sin obras calificadas, se reemplaza por la tarjeta "Aún sin favorita"                                                                                                                                                                                                                                                                                                 | Etiqueta con el título completo (aunque se corte en pantalla), la calificación ("5 de 5 estrellas") y la fecha                                     |
| Selector de año    | Reutiliza el chip de filtro, separación 8, en una fila desplazable horizontalmente si no caben. Al abrir, la fila se desplaza sola hasta dejar visible el año activo. Solo años con obras vistas más el actual, del más reciente al más antiguo; se abre en el actual (D4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Cada chip indica si está seleccionado (como pestañas). Alto 44                                                                                     |
| Pestaña "Mi año"   | Va entre "Mi lista" y "Perfil". Ícono de barras: Lucide `chart-column`, 22. Las otras pestañas conservan sus íconos actuales (Mi lista = `bookmark`). Inactiva: 11/600 en `textoTenue`; activa en `acento`. Cada pestaña mide al menos 64 de ancho y 44 de alto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Etiqueta "Mi año"                                                                                                                                  |
| Estado de pantalla | Tarjeta `superficie` con borde, radio `l`, relleno 24/20, centrada, separación 10. Ícono en un cuadro de 52 × 52 con radio 16, fondo `acentoSuave` e ícono en `acento` (variante error: `peligroSuave` y `peligro`). Título 16; texto 13 en `textoSecundario`, ancho máximo 260. Botón pequeño debajo cuando hay acción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Título y texto se leen juntos; el botón tiene su propia etiqueta                                                                                   |
| Indicador de carga | Círculo de 28 con borde 3 en `superficieAlta` y el tramo superior en `acento`; gira en 0,9 s. **Con "reducir movimiento" queda quieto**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Rol de progreso con la etiqueta "Cargando"                                                                                                         |
| Barra de progreso  | Alto 8, fondo `superficieAlta`, radio completo, relleno en `acento`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Rol de progreso con valor actual y máximo ("2 de 5")                                                                                               |

## 4. Pantallas

### Mi año en cine (con datos)

Maqueta del board a 390 × 844. Contenido desplazable con relleno 8 arriba, 20 a los lados y 20 abajo, y 12 entre
bloques. Orden de los bloques:

1. **Cabecera:** rótulo `etiqueta` "Tu resumen", título `display` "Mi año en cine" y, debajo (6 arriba), la frase
   del resumen en `cuerpo` ("¡Viste 42 obras este año! Nada mal.").
2. **Selector de año.**
3. **Tarjeta de dato "Obras vistas"**, a todo el ancho: número y apoyo "30 películas y 12 series".
4. **Fila de 2 tarjetas compactas** (separación 12): "Horas de cine" (número con unidad "h" y, si falta algún
   dato, "ⓘ 2 sin duración") y "Mes top" (texto "Octubre", apoyo "7 obras").
5. **Fila de 2 tarjetas compactas:** "Género" (texto "Drama", apoyo "14 obras") y "Director" (texto, apoyo
   "3 películas").
6. **Barras por mes** "Tu año mes a mes" con "Pico: octubre" (área de 96).
7. **Obra destacada** (póster de 140).
8. **Barra de pestañas**, con "Mi año" activa.

Los avisos van **arriba del resumen**, y el resto se ve normal:

- **Sin conexión (D13):** aviso con fondo `acentoSuave`.
- **Datos faltantes (D6, D7):** aviso informativo, no error.

Mientras se completan datos de TMDB se muestra el estado de progreso ("Completando 2 de 5 obras").

### Mi año en cine (año vacío, D12)

Cabecera sin la frase del resumen, selector de año con el año vacío seleccionado y, debajo (40 arriba), el estado
vacío con relleno 40/20: ícono de calendario, "Todavía no hay nada en 2025", "¿Empezamos? Marca lo que veas y
aquí aparecerá tu año." y el botón primario pequeño "Ir a Mi lista".

## 5. Voz

Cinta te habla de tú, como una amiga que también ve cine: cálida, breve y contenta con tus logros. Celebra lo que
viste sin exagerar y nunca te hace sentir culpa por no haber visto "suficiente". Cuando algo falla, mantiene la
calma y te dice qué hacer.

### Mensajes

Copiados del board. Los números y el año son de ejemplo: se reemplazan por los datos reales. Las filas marcadas
_(nuevo)_ no están en el board: las aprobó la usuaria el 21/11/2026.

| Situación                                | Título                           | Texto                                                                                                                                                                                                                                                                          | Botón         |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| Resumen                                  |                                  | ¡Viste 42 obras este año! Nada mal.                                                                                                                                                                                                                                            |               |
| Resumen (otro año) _(nuevo)_             |                                  | ¡Viste 12 obras en 2025! Nada mal.                                                                                                                                                                                                                                             |               |
| Singular _(nuevo)_                       |                                  | ¡Viste 1 obra este año! · 1 película y 2 series · 1 obra · 1 película · 1 obra se quedó sin datos de TMDB, así que no cuenta en horas, género ni director. · 1 obra vista todavía no tiene fecha; se suma cuando vuelvas a tener conexión. · Completando 1 de 1 obra. Ya casi. |               |
| Resumen (mes)                            |                                  | Octubre fue tu mes: 7 obras.                                                                                                                                                                                                                                                   |               |
| Vacío                                    | Todavía no hay nada en 2025      | ¿Empezamos? Marca lo que veas y aquí aparecerá tu año.                                                                                                                                                                                                                         | Ir a Mi lista |
| Error                                    | Uy, no pudimos cargar tu resumen | Revisa tu conexión y lo intentamos otra vez.                                                                                                                                                                                                                                   | Reintentar    |
| Sin conexión                             |                                  | Estás sin conexión. No pasa nada: te mostramos lo último que guardamos.                                                                                                                                                                                                        |               |
| Obras sin fecha (sin conexión) _(nuevo)_ |                                  | 3 obras vistas todavía no tienen fecha; se suman cuando vuelvas a tener conexión.                                                                                                                                                                                              |               |
| Datos faltantes                          |                                  | 2 obras se quedaron sin datos de TMDB, así que no cuentan en horas, género ni director.                                                                                                                                                                                        |               |
| Horas sin duración                       |                                  | ⓘ 2 películas sin duración no suman horas (compacta: "ⓘ 2 sin duración")                                                                                                                                                                                                       |               |
| Destacada sin calificar                  | Aún sin favorita                 | Califica lo que viste y te contamos cuál fue tu favorita del año.                                                                                                                                                                                                              |               |
| Director sin datos                       | Aún sin director favorito        | No hay datos suficientes: a las películas de este año les falta el director en TMDB.                                                                                                                                                                                           |               |
| Género sin datos _(nuevo)_               | Aún sin género favorito          | No hay datos suficientes: a las obras de este año les faltan los géneros en TMDB.                                                                                                                                                                                              |               |
| Fecha de la destacada _(nuevo)_          |                                  | Película · vista el 12 de octubre / Serie · vista el 3 de marzo                                                                                                                                                                                                                |               |
| Cargando                                 | Armando tu año…                  | Un momento y lo tienes.                                                                                                                                                                                                                                                        |               |
| Progreso                                 | Completando datos de TMDB        | Completando 2 de 5 obras. Ya casi.                                                                                                                                                                                                                                             |               |

Rótulos de las tarjetas: "Tu resumen", "Obras vistas", "Horas de cine" (apoyo "Solo cuentan películas"), "Mes
top", "Género", "Director" ("Director más visto" en su tarjeta sin datos), "Tu mejor calificada del año" ("Tu
mejor calificada" en su tarjeta sin datos), "Tu año mes a mes", "Pico: <mes>".

### Sí y no

| Sí                                       | No                                     |
| ---------------------------------------- | -------------------------------------- |
| ¡Viste 42 obras este año!                | El usuario ha visualizado 42 obras     |
| Octubre fue tu mes                       | Mes con mayor actividad registrada: 10 |
| 48,5 h                                   | 48.5 horas / 48 h 30 min               |
| Todavía no hay nada en 2025. ¿Empezamos? | ¡No has visto nada! 😢                 |
| Uy, no pudimos cargar tu resumen         | Error 500: fetch failed                |
| Nada mal · Qué buen año                  | ¡Eres el mejor cinéfilo del mundo!     |
| Ir a Mi lista                            | Haz clic aquí                          |
| Exclamaciones para celebrar algo real    | Exclamaciones en errores o avisos      |

## 6. Accesibilidad

### Contraste (mínimo 4,5 : 1 en todo texto)

Medido en el board con la fórmula de luminancia relativa de WCAG 2.1:

| Texto                        | Sobre `fondo` | Sobre `superficie` | Sobre `superficieAlta` | Alto contraste (`superficie`) |
| ---------------------------- | ------------- | ------------------ | ---------------------- | ----------------------------- |
| `texto`                      | 18,0          | 16,9               | 15,6                   | 17,6                          |
| `textoSecundario`            | 7,8           | 7,3                | 6,8                    | 15,5                          |
| `textoTenue`                 | 5,7           | 5,4                | 5,0                    | 12,4                          |
| `acento`                     | 17,1          | 16,1               | 14,9                   | 16,8                          |
| `peligro`                    | 7,8           | 7,3                | 6,8                    | 9,6                           |
| `sobreAcento` sobre `acento` | 17,1          | 17,1               | 17,1                   | 17,1                          |

Los estados y el error están en la sección 2.

**Reglas:**

- `textoTenue` nunca se usa sobre fondos más claros que `superficieAlta`, ni sobre `acentoSuave` (daría 3,98 : 1).
- Sobre `acentoSuave` y `peligroSuave`, el texto va en `texto`, `acento` o `peligro`.
- `estrellaVacia` y `barraInactiva` no son colores de texto.

### Tamaño y forma

- Todo lo que se toca mide al menos **44 × 44**, aunque el ícono mida 20. Los botones grandes miden 52.
- Hay 8 de separación entre tocables.

### Preferencias de la app (se aplican a toda la app)

- **Tamaño de texto:** 1, 1,15 o 1,3. Todo tamaño de letra se multiplica por `escala`; los contenedores crecen con
  el texto y no lo cortan.
- **Alto contraste:** se usa la columna "Alto contraste" de la paleta.
- **Reducir movimiento:** sin transiciones (duración 0) y con el indicador de carga quieto.

### Lectores de pantalla (TalkBack y VoiceOver)

- **Barras por mes:** una sola etiqueta para toda la tarjeta con los 12 valores ("Obras vistas por mes: enero 2,
  febrero 3, …, diciembre 0"). Nunca una barra suelta sin texto.
- **Estrellas:** "4 de 5 estrellas".
- **Progreso:** valor actual y máximo ("2 de 5").
- **Selector de año:** cada chip dice su año y si está seleccionado.
- **Pestaña:** "Mi año".
- **Tarjeta de dato:** se lee como una frase (rótulo, valor y apoyo).

## 7. Sí / No para el agente

| Sí                                                                                                | No                                                                          |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Usar los tokens de `src/tema/`                                                                    | Escribir colores en hexadecimal o rgba fuera de `src/tema/`                 |
| Construir las barras por mes con `View`                                                           | Usar librerías de gráficas                                                  |
| Usar `acento` solo para lo importante (acción principal, dato destacado, pestaña activa, mes top) | Usar `acento` en la atribución de TMDB o ponerla junto al logotipo de Cinta |
| Multiplicar cada tamaño de letra por `escala`                                                     | Escribir tamaños de letra fijos                                             |
| Dar 44 × 44 a todo lo que se toca                                                                 | Tocables más chicos, aunque el ícono sea pequeño                            |
| Usar `textoTenue` sobre `fondo`, `superficie` o `superficieAlta`                                  | Usar `textoTenue` sobre `acentoSuave`, `peligroSuave` o fondos más claros   |
| Usar la tarjeta de dato compacta cuando van dos por fila                                          | Inventar tamaños de dato que no estén en este archivo                       |
| Mostrar siempre los 12 meses, también los de 0                                                    | Ocultar los meses sin obras                                                 |
| Respetar "reducir movimiento" en cada animación                                                   | Animaciones largas o que no se pueden quitar                                |
| Escribir los decimales con coma (37,5 h)                                                          | Usar punto decimal o "h min"                                                |
| Usar los mensajes de la sección 5                                                                 | Exclamaciones en errores o avisos; textos técnicos ("Error 500")            |
| Hablar de tú                                                                                      | Comparar al usuario con otros o hacerlo sentir culpa                        |
| Leer este archivo antes de tocar `src/screens/` o `src/components/`                               | Modificar `DESIGN.md` por iniciativa propia                                 |
| Fuente del sistema e íconos Lucide                                                                | Fuentes o íconos nuevos sin que lo pida la spec                             |
| Etiquetas para TalkBack y VoiceOver en todo lo que se toca o informa                              | Gráficos o íconos sin etiqueta                                              |

## 8. Decisiones pendientes

El board no define estos puntos. No los decidas tú: pregunta antes de implementarlos.

Por ahora no hay ninguna: las cuatro que había se decidieron en la sección 9.

## 9. Decisiones tomadas (21/11/2026)

Las tomó la usuaria. Ya están aplicadas en la sección 3.

1. **Tarjeta "Obras vistas" (sola, a todo el ancho):** usa la variante normal, número 48. La compacta es solo para
   las filas de dos.
2. **Barras por mes:** crecen desde 0 hasta su alto en 300 ms al abrir la pantalla o cambiar de año, con
   `Animated` de React Native (sin librerías nuevas). Con "reducir movimiento" aparecen directamente en su alto,
   sin animación.
3. **Título largo de la obra destacada:** máximo 2 líneas con "…"; el título completo va en la etiqueta de
   accesibilidad.
4. **Selector con muchos años:** fila desplazable que al abrir se desplaza sola hasta dejar visible el año activo.
