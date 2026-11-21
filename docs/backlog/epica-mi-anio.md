# Backlog — Épica "Mi año en cine"

## 1. Épica

- **Nombre:** Mi año en cine
- **Objetivo:** una pestaña nueva donde el usuario ve el resumen de lo que vio en un año: obras vistas (películas y
  series), horas de cine, género y director más vistos, mes más activo con una barra por mes, obra destacada y
  selector de año. Para que sea posible, la app guarda cuándo se vio cada obra y sus géneros, duración y
  directores, y completa las obras que ya estaban en la lista sin perder nada.
- **PRD:** [docs/prd/PRD.md](../prd/PRD.md) (reglas de negocio D1 a D13 y puntos abiertos P1 a P19).

Los criterios marcados **(pendiente P#)** usan la propuesta del punto abierto P# del PRD mientras el cliente no
responda.

**Cómo se verifica cada criterio**

- **Test Vitest:** lógica de dominio en `src/dominio/`, sin Firebase, React ni fechas del sistema.
- **Teléfono:** una acción concreta en Expo Go.
- **Firebase:** una acción en la consola de Firebase (ver un documento o usar el Rules Playground). Se usa para lo
  que no se ve desde el teléfono, como un campo guardado o una regla de seguridad, y siempre va junto a un test o a
  una acción en el teléfono.

## 2. Historias y criterios de aceptación

### HU-A.1 — Fecha de visionado

**Como** usuario, **quiero** que la app recuerde cuándo vi cada obra, **para** que mi resumen la cuente en el año
correcto.

| Id       | DADO                                             | CUANDO                                               | ENTONCES                                                                     | Decisión           | Verificación                                                                                                                             |
| -------- | ------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| CA-A.1.1 | una obra en "por ver" o "viendo"                 | la marco como "vista" y guardo                       | `vistaEn` se guarda con la hora del servidor (`serverTimestamp`)             | D1                 | Test Vitest (la transición indica "poner fecha"). Teléfono: marcar una obra como vista y guardar. Firebase: el documento tiene `vistaEn` |
| CA-A.1.2 | una obra en "vista" con `vistaEn`                | la cambio a "viendo" o "por ver" y guardo            | `vistaEn` vuelve a `null`                                                    | D1                 | Test Vitest. Teléfono: cambiar a "viendo" y guardar. Firebase: `vistaEn` es `null`                                                       |
| CA-A.1.3 | una obra que estuvo en "vista" y pasó a "viendo" | vuelve a "vista"                                     | `vistaEn` toma la fecha nueva, no la anterior                                | D1                 | Test Vitest                                                                                                                              |
| CA-A.1.4 | una obra en "vista" con `vistaEn`                | cambio solo la calificación o el comentario y guardo | `vistaEn` no cambia                                                          | D1                 | Test Vitest                                                                                                                              |
| CA-A.1.5 | una obra en "vista" con `vistaEn`                | la guardo sin cambiar el estado                      | `vistaEn` se conserva                                                        | D1 (pendiente P5)  | Test Vitest                                                                                                                              |
| CA-A.1.6 | el teléfono sin conexión                         | marco una obra como "vista"                          | se usa la hora estimada del teléfono y, al reconectar, queda la del servidor | D1 (pendiente P11) | Teléfono: modo avión, marcar como vista, abrir el resumen y quitar el modo avión. Firebase: `vistaEn` con la hora del servidor           |
| CA-A.1.7 | una obra en "por ver" o "viendo"                 | se intenta guardar un `vistaEn` con fecha            | Firestore rechaza la escritura                                               | D1 (regla 1.6)     | Firebase: Rules Playground con un `update` que pone `vistaEn` y `estado: 'viendo'` → denegado                                            |

### HU-A.2 — Resumen del año

**Como** usuario, **quiero** ver mi resumen del año, **para** saber cuánto y qué vi.

| Id        | DADO                                                                                | CUANDO                                       | ENTONCES                                                                       | Decisión                | Verificación                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-A.2.1  | una obra con `vistaEn` el 31/12 a las 23:30, hora local del teléfono                | veo el resumen de ese año y el del siguiente | cuenta en ese año y no en el siguiente                                         | D3 (pendiente P4)       | Test Vitest (con la zona horaria fija en el test)                                                                                                              |
| CA-A.2.2  | obras vistas en varios años                                                         | veo el resumen de un año                     | cada obra del año cuenta una sola vez y las de otros años no cuentan           | D3                      | Test Vitest                                                                                                                                                    |
| CA-A.2.3  | 3 películas y 2 series vistas en el año                                             | veo el resumen                               | dice 5 obras: 3 películas y 2 series                                           | D3                      | Test Vitest. Teléfono: comparar con un conteo a mano en Mi lista                                                                                               |
| CA-A.2.4  | una película en Buscar o en Detalle                                                 | la agrego a mi lista                         | se guardan `generos` (nombres en español), `duracionMin` y `directores`        | D5                      | Test Vitest (armado de los datos desde TMDB). Teléfono: agregar una película. Firebase: el documento tiene los 3 campos                                        |
| CA-A.2.5  | una serie                                                                           | la agrego a mi lista                         | se guardan sus `generos`, `duracionMin: null` y `directores: []`               | D5                      | Test Vitest. Teléfono: agregar una serie. Firebase: los 3 campos con esos valores                                                                              |
| CA-A.2.6  | una película que en TMDB dura 0 minutos o más de 1000                               | la agrego                                    | `duracionMin` se guarda como `null`                                            | D5 (pendiente P13)      | Test Vitest                                                                                                                                                    |
| CA-A.2.7  | una obra con más de 10 géneros o más de 10 directores en TMDB                       | la agrego                                    | se guardan solo los 10 primeros de cada lista                                  | D5 (pendiente P14)      | Test Vitest                                                                                                                                                    |
| CA-A.2.8  | una película de ciencia ficción                                                     | la agrego                                    | el género se guarda con el nombre que da TMDB en `es-MX` ("Ciencia ficción")   | D5 (pendiente P12)      | Teléfono: agregar la película. Firebase: el nombre del género en español                                                                                       |
| CA-A.2.9  | TMDB no responde                                                                    | agrego una obra                              | la obra se agrega igual, sin `generos`, `duracionMin` ni `directores`          | D5 (pendiente P19)      | Teléfono: buscar una película, activar el modo avión y tocar Agregar; la obra aparece en Mi lista. Firebase: al reconectar, el documento no tiene los 3 campos |
| CA-A.2.10 | películas vistas en el año que suman 2250 minutos                                   | veo el resumen                               | las horas de cine son 37,5 h (redondeado a un decimal, con coma)               | D7 (pendiente P15)      | Test Vitest. Teléfono: la tarjeta de horas muestra el valor con coma                                                                                           |
| CA-A.2.11 | una serie vista en el año                                                           | veo el resumen                               | cuenta en el total de obras pero no suma horas                                 | D7                      | Test Vitest                                                                                                                                                    |
| CA-A.2.12 | una película vista sin `duracionMin`                                                | veo el resumen                               | no suma horas y el resumen indica "1 película sin duración"                    | D7                      | Test Vitest (`peliculasSinDuracion = 1`). Teléfono: la tarjeta de horas lo indica                                                                              |
| CA-A.2.13 | "Drama" en 3 obras y "Comedia" en 2                                                 | veo el resumen                               | el género más visto es Drama con 3 obras                                       | D8                      | Test Vitest                                                                                                                                                    |
| CA-A.2.14 | "Drama" y "Comedia" con 2 obras cada uno; promedio de calificación 4 y 3            | veo el resumen                               | gana Drama (mayor promedio)                                                    | D8                      | Test Vitest                                                                                                                                                    |
| CA-A.2.15 | "Drama" y "Comedia" empatados; Drama sin obras calificadas y Comedia con promedio 1 | veo el resumen                               | gana Comedia (sin calificadas pierde)                                          | D8                      | Test Vitest                                                                                                                                                    |
| CA-A.2.16 | "Drama" y "Comedia" empatados y ninguno con obras calificadas                       | veo el resumen                               | gana Comedia (orden alfabético)                                                | D8 (pendiente P2)       | Test Vitest                                                                                                                                                    |
| CA-A.2.17 | "Animación" y "Acción" empatados en obras y con el mismo promedio exacto            | veo el resumen                               | gana Acción (orden alfabético en español, sin distinguir tildes ni mayúsculas) | D8 (pendiente P2 y P18) | Test Vitest                                                                                                                                                    |
| CA-A.2.18 | una serie con el género "Drama"                                                     | veo el resumen                               | la serie suma 1 a Drama                                                        | D8                      | Test Vitest                                                                                                                                                    |
| CA-A.2.19 | una película y una serie con directores distintos                                   | veo el resumen                               | solo cuentan los directores de la película                                     | D9                      | Test Vitest                                                                                                                                                    |
| CA-A.2.20 | dos directores con 2 películas cada uno y promedio 5 y 4                            | veo el resumen                               | gana el de promedio 5                                                          | D9                      | Test Vitest                                                                                                                                                    |
| CA-A.2.21 | dos directores empatados en películas y promedio                                    | veo el resumen                               | gana el primero en orden alfabético                                            | D9 (pendiente P2)       | Test Vitest                                                                                                                                                    |
| CA-A.2.22 | ninguna película vista del año tiene directores                                     | veo el resumen                               | `directorTop` es `null` y la tarjeta dice que no hay datos suficientes         | D9                      | Test Vitest. Teléfono: año con solo series → la tarjeta del director lo dice                                                                                   |
| CA-A.2.23 | 4 obras vistas en marzo y 2 en julio                                                | veo el resumen                               | el mes más activo es marzo                                                     | D10                     | Test Vitest                                                                                                                                                    |
| CA-A.2.24 | 3 obras vistas en marzo y 3 en diciembre                                            | veo el resumen                               | el mes más activo es diciembre (el más reciente)                               | D10                     | Test Vitest                                                                                                                                                    |
| CA-A.2.25 | obras vistas solo en mayo                                                           | veo el resumen                               | `obrasPorMes` tiene 12 posiciones, 11 en 0, y se ven 12 barras                 | D10                     | Test Vitest. Teléfono: contar 12 barras, con las vacías visibles                                                                                               |
| CA-A.2.26 | un año sin obras vistas                                                             | calculo el resumen                           | `mesTop` es `null` y `obrasPorMes` son 12 ceros                                | D10                     | Test Vitest                                                                                                                                                    |
| CA-A.2.27 | obras del año calificadas con 3, 5 y 4                                              | veo el resumen                               | la destacada es la de 5                                                        | D11                     | Test Vitest                                                                                                                                                    |
| CA-A.2.28 | dos obras con 5 y `vistaEn` distintos                                               | veo el resumen                               | la destacada es la de `vistaEn` más reciente                                   | D11                     | Test Vitest                                                                                                                                                    |
| CA-A.2.29 | dos obras con 5 y exactamente el mismo `vistaEn`                                    | veo el resumen                               | la destacada es la primera por título en orden alfabético                      | D11 (pendiente P1)      | Test Vitest                                                                                                                                                    |
| CA-A.2.30 | una obra calificada con 1 y otra sin calificación                                   | veo el resumen                               | la destacada es la calificada con 1                                            | D11                     | Test Vitest                                                                                                                                                    |
| CA-A.2.31 | obras vistas en el año, ninguna calificada                                          | veo el resumen                               | `destacada` es `null` y la tarjeta invita a calificar                          | D11                     | Test Vitest. Teléfono: año sin calificaciones → la tarjeta invita a calificar                                                                                  |

### HU-A.3 — Selector de año

**Como** usuario, **quiero** cambiar de año, **para** revisar lo que vi en años anteriores.

| Id       | DADO                                                                       | CUANDO                         | ENTONCES                                | Decisión          | Verificación                                         |
| -------- | -------------------------------------------------------------------------- | ------------------------------ | --------------------------------------- | ----------------- | ---------------------------------------------------- |
| CA-A.3.1 | obras vistas en 2022 y 2024, obras "por ver" de 2023, y el año actual 2026 | abro el selector               | muestra 2026, 2024 y 2022, en ese orden | D4                | Test Vitest                                          |
| CA-A.3.2 | ninguna obra vista en el año actual                                        | abro el selector               | el año actual aparece igual             | D4                | Test Vitest                                          |
| CA-A.3.3 | obras vistas en el año actual                                              | abro el selector               | el año actual aparece una sola vez      | D4                | Test Vitest                                          |
| CA-A.3.4 | obras vistas en varios años                                                | abro la pestaña Mi año en cine | se abre en el año actual                | D4                | Teléfono: abrir la pestaña y ver el año seleccionado |
| CA-A.3.5 | la fecha del teléfono en un año futuro (2030)                              | abro el selector               | aparece 2030 como año actual, vacío     | D4 (pendiente P8) | Test Vitest (`anioActual = 2030`)                    |
| CA-A.3.6 | el año actual sin obras vistas                                             | lo elijo en el selector        | se muestra el estado vacío (D12)        | D4, D12           | Teléfono: elegir un año sin obras vistas             |

### HU-A.4 — Obras anteriores a la épica

**Como** usuario, **quiero** ver mi resumen aunque mis obras sean anteriores a esta épica, **para** no perder mi
historial.

| Id        | DADO                                                                      | CUANDO                                     | ENTONCES                                                                                              | Decisión               | Verificación                                                                                                                             |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| CA-A.4.1  | una obra en "vista" sin `vistaEn`, con conexión                           | abro Mi año en cine                        | recibe `vistaEn = actualizadoEn` y se guarda en Firestore                                             | D2                     | Test Vitest (selección y fecha). Firebase: anotar `actualizadoEn` antes, abrir la pestaña y comparar con `vistaEn`                       |
| CA-A.4.2  | la migración ya se hizo                                                   | vuelvo a abrir Mi año en cine              | no hay obras que migrar y no se escribe nada                                                          | D2                     | Test Vitest (la selección queda vacía). Firebase: `actualizadoEn` no cambia en la segunda apertura                                       |
| CA-A.4.3  | obras en "por ver" o "viendo", y obras en "vista" que ya tienen `vistaEn` | abro Mi año en cine                        | ninguna de ellas se migra                                                                             | D2                     | Test Vitest                                                                                                                              |
| CA-A.4.4  | una obra en "vista" sin `vistaEn` y sin `actualizadoEn`                   | abro Mi año en cine                        | no se migra y cuenta como "sin fecha" (no aparece en ningún año)                                      | D2 (pendiente P6)      | Test Vitest                                                                                                                              |
| CA-A.4.5  | una obra migrada                                                          | reviso el documento                        | `actualizadoEn` cambió a la hora de la migración                                                      | D2 (pendiente P10)     | Firebase: comparar `actualizadoEn` antes y después de abrir la pestaña                                                                   |
| CA-A.4.6  | 5 obras vistas del año elegido sin datos de TMDB                          | abro el resumen con conexión               | se completan de una en una y se ve el progreso ("Completando 2 de 5")                                 | D6                     | Test Vitest (selección). Teléfono: ver el progreso avanzar                                                                               |
| CA-A.4.7  | obras vistas sin datos en el año elegido y en otro año                    | abro el resumen del año elegido            | solo se piden a TMDB las del año elegido                                                              | D6                     | Test Vitest                                                                                                                              |
| CA-A.4.8  | una obra vista del año para la que TMDB falla                             | se completa el resumen                     | cuenta en el total pero no en horas, género ni director, y el resumen dice "1 obra sin datos"         | D6                     | Test Vitest (`obrasSinDatos = 1`). Firebase: crear en la consola una obra "vista" con `tmdbId` 999999999. Teléfono: el resumen lo indica |
| CA-A.4.9  | TMDB responde 429 para una obra, o 404 para otra                          | se completa el resumen y lo vuelvo a abrir | la del 429 se vuelve a pedir en la siguiente apertura; la del 404 no se vuelve a pedir                | D6 (pendiente P7)      | Test Vitest                                                                                                                              |
| CA-A.4.10 | una obra completada a la que TMDB le devolvió `generos: []`               | vuelvo a abrir el resumen                  | no se vuelve a pedir a TMDB                                                                           | D6 (pendiente P9)      | Test Vitest                                                                                                                              |
| CA-A.4.11 | una obra en "vista" sin `vistaEn` y sin datos de TMDB                     | abro el resumen con conexión               | primero recibe `vistaEn` (D2) y después, si es del año elegido, se completa (D6) en la misma apertura | D2, D6 (pendiente P16) | Teléfono: abrir la pestaña. Firebase: la obra tiene `vistaEn` y los 3 campos                                                             |
| CA-A.4.12 | una obra agregada mientras TMDB no respondía (sin datos)                  | la marco como vista y abro el resumen      | se completa con D6                                                                                    | D6 (pendiente P19)     | Test Vitest (la obra entra en la selección de D6)                                                                                        |

### HU-A.5 — Resumen vacío o incompleto

**Como** usuario, **quiero** entender un resumen vacío o incompleto, **para** saber qué pasa y qué hacer.

| Id       | DADO                                                                   | CUANDO              | ENTONCES                                                                                          | Decisión            | Verificación                                                                                                          |
| -------- | ---------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CA-A.5.1 | un año sin obras vistas                                                | lo veo              | se muestra el estado vacío con el botón "Ir a Mi lista", y al tocarlo se abre la pestaña Mi lista | D12                 | Test Vitest (`totalObras = 0`). Teléfono: tocar "Ir a Mi lista"                                                       |
| CA-A.5.2 | un año con obras en "por ver" o "viendo" pero ninguna en "vista"       | lo veo              | se muestra el estado vacío                                                                        | D12                 | Test Vitest                                                                                                           |
| CA-A.5.3 | el teléfono sin conexión y una copia de la lista en AsyncStorage       | abro Mi año en cine | el resumen se calcula con la copia y se muestra un aviso de sin conexión                          | D13                 | Teléfono: abrir la app con conexión, activar el modo avión y abrir la pestaña                                         |
| CA-A.5.4 | el teléfono sin conexión y obras por migrar o sin datos                | abro Mi año en cine | no se migran fechas ni se completan datos, y no aparece el progreso                               | D13                 | Teléfono: modo avión y abrir la pestaña. Firebase: los documentos no cambian                                          |
| CA-A.5.5 | el teléfono sin conexión y obras en "vista" sin `vistaEn`              | abro Mi año en cine | esas obras no cuentan en ningún año y el aviso dice cuántas faltan                                | D13 (pendiente P3)  | Test Vitest. Teléfono: el aviso muestra el número                                                                     |
| CA-A.5.6 | la lista viene de la caché de Firestore (sin red, app abierta en frío) | abro Mi año en cine | se muestra el aviso de sin conexión, no el estado vacío                                           | D13 (pendiente P17) | Teléfono: modo avión, cerrar la app por completo, abrirla y entrar a la pestaña                                       |
| CA-A.5.7 | la lista todavía se está cargando                                      | abro Mi año en cine | se ve un indicador de carga                                                                       | — (HU-A.5)          | Teléfono: abrir la pestaña recién iniciada la app                                                                     |
| CA-A.5.8 | Firestore rechaza la lectura de la lista                               | abro Mi año en cine | se ve un mensaje de error con "Reintentar" (hoy H12 lo mostraría como "Sin conexión")             | — (HU-A.5)          | Teléfono: publicar por un momento una regla que niega la lectura de `mi_lista`, abrir la pestaña y restaurar la regla |
| CA-A.5.9 | un año con obras sin datos de TMDB y películas sin duración            | veo el resumen      | se ven los dos mensajes: cuántas obras quedaron sin datos y cuántas películas no tienen duración  | D6, D7              | Teléfono: año con una obra sin datos (CA-A.4.8) y una película sin duración                                           |

## 3. Trazabilidad

| Decisión | Criterios que la cubren                                                           |
| -------- | --------------------------------------------------------------------------------- |
| D1       | CA-A.1.1, CA-A.1.2, CA-A.1.3, CA-A.1.4, CA-A.1.5, CA-A.1.6, CA-A.1.7              |
| D2       | CA-A.4.1, CA-A.4.2, CA-A.4.3, CA-A.4.4, CA-A.4.5, CA-A.4.11                       |
| D3       | CA-A.2.1, CA-A.2.2, CA-A.2.3                                                      |
| D4       | CA-A.3.1, CA-A.3.2, CA-A.3.3, CA-A.3.4, CA-A.3.5, CA-A.3.6                        |
| D5       | CA-A.2.4, CA-A.2.5, CA-A.2.6, CA-A.2.7, CA-A.2.8, CA-A.2.9                        |
| D6       | CA-A.4.6, CA-A.4.7, CA-A.4.8, CA-A.4.9, CA-A.4.10, CA-A.4.11, CA-A.4.12, CA-A.5.9 |
| D7       | CA-A.2.10, CA-A.2.11, CA-A.2.12, CA-A.5.9                                         |
| D8       | CA-A.2.13, CA-A.2.14, CA-A.2.15, CA-A.2.16, CA-A.2.17, CA-A.2.18                  |
| D9       | CA-A.2.19, CA-A.2.20, CA-A.2.21, CA-A.2.22                                        |
| D10      | CA-A.2.23, CA-A.2.24, CA-A.2.25, CA-A.2.26                                        |
| D11      | CA-A.2.27, CA-A.2.28, CA-A.2.29, CA-A.2.30, CA-A.2.31                             |
| D12      | CA-A.3.6, CA-A.5.1, CA-A.5.2                                                      |
| D13      | CA-A.5.3, CA-A.5.4, CA-A.5.5, CA-A.5.6                                            |

CA-A.5.7 y CA-A.5.8 no dependen de una decisión: vienen de la historia HU-A.5.

## 4. Tickets

Se implementan en este orden.

**Definition of Done común a todos los tickets**

- La spec del cambio está commiteada con `docs:` antes del código.
- `npm test` y `npx tsc --noEmit` pasan (salvo T-02, ver su nota), y `npx expo lint` no da errores.
- El commit se hace con `/commit`.
- Los criterios del ticket con verificación "Teléfono" o "Firebase" se probaron y quedaron anotados en
  `docs/VERIFICACION.md`.
- No se desactiva ni se borra ningún test.

### T-01 — Modelo y tipos

- **Historia y criterios:** base de HU-A.1 a HU-A.5; CA-A.4.4 (no inventar la fecha), CA-A.5.3 (leer copias viejas).
- **Qué:** `ItemLista` suma `vistaEn`, `generos`, `duracionMin` y `directores`. `aItem` y la copia de AsyncStorage
  los leen con valores por defecto cuando faltan. `aMs` deja de poner la fecha de hoy cuando falta una fecha (H9,
  P6).
- **Archivos:** `src/types/index.ts`, `src/services/listaService.ts`.
- **DoD extra:** la app abre igual con una lista guardada antes de la épica (Teléfono).

### T-02 — Tests del dominio (en rojo)

- **Historia y criterios:** todos los criterios con "Test Vitest" de HU-A.1 a HU-A.5.
- **Qué:** tests de `resumenAnual`, `aniosDisponibles`, la transición de `vistaEn` (D1), la selección de las
  migraciones (D2, D6) y el armado de los datos de TMDB (D5, P13, P14). Las funciones existen solo como firmas
  que lanzan "no implementado", para que `npx tsc --noEmit` pase.
- **Archivos:** `src/dominio/resumenAnual.test.ts`, `src/dominio/reglasLista.test.ts`, `src/dominio/migraciones.test.ts`
  y las firmas en `src/dominio/`.
- **DoD extra:** commit `test:` con los tests en rojo por la razón correcta ("no implementado"), y `tsc` sin errores.
- **Nota:** hoy la skill `/commit` bloquea el commit si `npm test` falla. Antes de este ticket hay que ajustarla
  (commit `chore:`) para permitir un commit `test:` con tests en rojo.

### T-03 — Dominio

- **Historia y criterios:** los mismos de T-02.
- **Qué:** implementar las funciones de dominio hasta que los tests de T-02 pasen.
- **Archivos:** `src/dominio/resumenAnual.ts`, `src/dominio/reglasLista.ts`, `src/dominio/migraciones.ts`.
- **DoD extra:** todos los tests en verde; el dominio no importa Firebase ni React y no usa `new Date()`.

### T-04 — Reglas de Firestore

- **Historia y criterios:** CA-A.1.7, CA-A.2.6, CA-A.2.7, CA-A.4.5.
- **Qué:** agregar los 4 campos a `hasOnly` y las condiciones de la sección 1.6 del enunciado.
- **Archivos:** `firestore.rules`, `docs/Reglas.md` (copia, H21).
- **DoD extra:** reglas publicadas; Firebase: una escritura con `duracionMin: -5` es rechazada; dos cuentas siguen
  aisladas; las obras viejas se siguen pudiendo editar.
- **Nota:** va antes de T-05, T-06 y T-07 porque, sin las reglas nuevas, Firestore rechaza toda escritura con los
  campos nuevos.

### T-05 — Datos de TMDB al agregar

- **Historia y criterios:** HU-A.2; CA-A.2.4 a CA-A.2.9.
- **Qué:** al agregar, pedir el detalle a TMDB (directores del equipo técnico, duración en minutos, géneros en
  `es-MX`) y guardar los 3 campos. Si TMDB falla, la obra se agrega sin ellos (P19).
- **Archivos:** `src/services/tmdbService.ts`, `src/services/listaService.ts` (`agregar`),
  `src/context/CarteleraContext.tsx` (`agregar`).
- **DoD extra:** Teléfono: agregar una película desde Buscar y una serie desde Detalle. Firebase: los campos
  guardados.

### T-06 — Fecha de visionado (`vistaEn`)

- **Historia y criterios:** HU-A.1; CA-A.1.1 a CA-A.1.6.
- **Qué:** al guardar, usar la transición del dominio para poner `serverTimestamp`, poner `null` o no tocar
  `vistaEn`.
- **Archivos:** `src/services/listaService.ts` (`actualizar`), `src/context/CarteleraContext.tsx` (`actualizar`).
- **DoD extra:** Teléfono y Firebase: marcar como vista, sacar de vista, volver a vista y editar solo el comentario.

### T-07 — Migraciones D2 y D6

- **Historia y criterios:** HU-A.4 y HU-A.5; CA-A.4.1 a CA-A.4.12, CA-A.5.4, CA-A.5.6.
- **Qué:** al abrir la pestaña con conexión, migrar las fechas (D2) y después completar los datos del año elegido
  de una en una con progreso (D6). Sin conexión no se hace nada (D13). Si la lista viene de la caché de Firestore,
  se trata como sin conexión (P17, H1).
- **Archivos:** `src/services/listaService.ts`, un hook nuevo en `src/hooks/`.
- **DoD extra:** Firebase: las obras viejas quedan con `vistaEn` y los 3 campos; la obra con `tmdbId` 999999999
  queda sin datos.

### T-08 — Tokens de diseño

- **Historia y criterios:** ninguno propio; es requisito de T-09 y T-11.
- **Qué:** crear `src/tema/` con los tokens de DESIGN.md.
- **Archivos:** `src/tema/*`.
- **DoD extra:** los valores coinciden con DESIGN.md y con el brand board.

### T-09 — Pantalla y componentes

- **Historia y criterios:** HU-A.2 y HU-A.3; parte visual de CA-A.2.3, CA-A.2.10, CA-A.2.12, CA-A.2.22, CA-A.2.25,
  CA-A.2.31, CA-A.3.4, CA-A.3.6.
- **Qué:** pestaña nueva "Mi año en cine"; tarjeta de dato, barras por mes hechas con `View`, tarjeta de obra
  destacada y selector de año.
- **Archivos:** `src/navigation/index.tsx`, `src/screens/MiAnioScreen.tsx`, `src/components/resumen.tsx`.
- **DoD extra:** se leyó DESIGN.md antes de empezar; sin colores fijos fuera de `src/tema/`; elementos tocables de
  al menos 44 px; etiquetas para TalkBack y VoiceOver; Teléfono: el resumen coincide con un conteo a mano.

### T-10 — Estados de pantalla

- **Historia y criterios:** HU-A.5; CA-A.5.1 a CA-A.5.9 y el progreso de CA-A.4.6 y CA-A.4.8.
- **Qué:** carga, vacío (D12), error con "Reintentar", sin conexión (D13), datos faltantes (D6, D7) y progreso de
  la migración.
- **Archivos:** `src/screens/MiAnioScreen.tsx`, `src/components/resumen.tsx`.
- **DoD extra:** Teléfono: cada estado se ve al menos una vez, con su mensaje.

### T-11 — Pantallas del Proyecto 3 a tokens

- **Historia y criterios:** ninguno de la épica; cierra H7 de la auditoría.
- **Qué:** reemplazar los colores y tamaños fijos de las pantallas y componentes del Proyecto 3 por los tokens de
  `src/tema/`, y retirar `src/theme.ts`.
- **Archivos:** `src/screens/*`, `src/components/*`, `src/context/AccesibilidadContext.tsx`, `src/theme.ts`.
- **DoD extra:** el test de colores fijos pasa; Teléfono: las pantallas del Proyecto 3 se ven igual que antes,
  también con alto contraste.

## 5. Notas para la spec

- **P7 y P9 juntos:** para no volver a pedir una obra que dio 404, hay que marcarla (por ejemplo, con
  `generos: []`). Pero entonces dejaría de contar como "sin datos" en CA-A.4.8. La spec tiene que definir cómo se
  distinguen.
- **CA-A.2.1:** el test necesita una zona horaria fija para no depender de la del computador donde corre.
