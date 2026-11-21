# Spec 01 — Mi año en cine

- **Fecha:** 21/11/2026
- **Documentos de origen:** [PRD](../prd/PRD.md) (D1–D13, P1–P19) · [Backlog](../backlog/epica-mi-anio.md) (HU-A.1 a
  HU-A.5, CA, T-01 a T-11) · [DESIGN.md](../../DESIGN.md) · [AGENTS.md](../../AGENTS.md)
- **Regla:** este es el documento de todos los tickets de la épica. Si un ticket necesita algo distinto, antes del
  código va un commit `docs:` que corrige esta spec.

## 1. Alcance

**Dentro del alcance**

- Pestaña y pantalla "Mi año en cine" con el resumen de un año (D3–D12).
- Los campos `vistaEn`, `generos`, `duracionMin` y `directores` en `usuarios/{uid}/mi_lista/{itemId}`.
- Guardar los datos de TMDB al agregar (D5), con un tiempo máximo de 5 s (P19).
- Registrar `vistaEn` al cambiar el estado (D1).
- Migraciones al abrir la pantalla: fechas (D2) y datos de TMDB del año elegido (D6).
- Reglas de Firestore para los campos nuevos.
- Funciones de dominio puras y sus tests en Vitest.
- Tokens en `src/tema/` y paso de las pantallas del Proyecto 3 a tokens (T-08, T-11).
- **Correcciones de la auditoría que la épica necesita:** H1 (lista vacía sin red), H9 (`aMs` inventa la fecha),
  H12 (todo error se muestra como "Sin conexión") y H7 (color fijo en `AccesibilidadContext`).
- Una lista local (AsyncStorage) de las obras que TMDB ya no tiene (404), para no volver a pedirlas (P7).

**Fuera del alcance**

- Revisionados, librerías de gráficas, editar `vistaEn` a mano, compartir o exportar el resumen, comparar con
  otras cuentas, versión web, Cloud Functions (PRD, sección 3).
- Campos nuevos en Firestore fuera de los cuatro de la sección 1.6 del enunciado.

## 2. Cambios al modelo

### Firestore (`usuarios/{uid}/mi_lista/{itemId}`)

| Campo         | Tipo en Firestore        | Cuándo se escribe                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `vistaEn`     | timestamp o `null`       | `serverTimestamp()` al pasar a "vista"; `null` al salir (D1); `actualizadoEn` en D2 |
| `generos`     | lista de texto (máx. 10) | Al agregar o al completar (D5, D6). **Si falta, la obra nunca se completó (P9)**    |
| `duracionMin` | entero 1–1000 o `null`   | Junto con `generos`. `null` en series o sin dato                                    |
| `directores`  | lista de texto (máx. 10) | Junto con `generos`. Vacía en series                                                |

Los tres campos de TMDB se escriben **siempre juntos**. Nunca se escribe `null` en `generos` ni en `directores`:
si no hay datos se omiten los tres.

### Tipos (`src/types/index.ts`)

```ts
export interface DatosTmdb {
  generos: string[];
  duracionMin: number | null;
  directores: string[];
}

export interface ItemLista extends Obra {
  id: string;
  estado: EstadoVisionado;
  calificacionPersonal: number | null;
  comentario: string;
  agregadoEn: number | null; // null si falta (H9)
  actualizadoEn: number | null; // null si falta (H9)
  vistaEn: number | null; // ms; null si no está vista o aún no se migró
  generos: string[] | null; // null = nunca completado (P9)
  duracionMin: number | null;
  directores: string[] | null; // null cuando generos es null
}

export interface DetalleObra extends Obra {
  // … campos actuales …
  datos: DatosTmdb; // nuevo, armado con armarDatosTmdb
}

export interface TmdbDetalle /* … */ {
  credits?: { cast: TmdbMiembroElenco[]; crew?: { name: string; job: string }[] };
}
```

### Lectura de documentos y copias viejas

- **`aMs(t)`** devuelve `t?.toMillis() ?? null`: ya no pone la fecha de hoy (corrige H9).
- **`normalizarItem(crudo): ItemLista`** (nuevo, en `listaService`) revisa el tipo de cada campo nuevo y, si
  falta o no es del tipo esperado, usa `null`:
  - `vistaEn`: número en ms o `null`;
  - `generos`: lista de texto o `null`; si es `null`, `duracionMin` y `directores` también son `null`;
  - `duracionMin`: número o `null`; `directores`: lista de texto o `null`.
- `aItem` (Firestore) y `leerCacheLista` (AsyncStorage) pasan por `normalizarItem`. Así una copia guardada antes
  de la épica se lee igual.

## 3. Funciones de dominio

Todas son puras: no importan Firebase ni React y no usan `new Date()`. La fecha y el año llegan como parámetros.

| Archivo                       | Firma                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/dominio/resumenAnual.ts` | `export type Calendario = (ms: number) => { anio: number; mes: number };`                                                                     |
|                               | `export function resumenAnual(items: ItemLista[], anio: number, calendario: Calendario): ResumenAnual`                                        |
|                               | `export function aniosDisponibles(items: ItemLista[], anioActual: number, calendario: Calendario): number[]`                                  |
|                               | `export function formatearHoras(horas: number): string`                                                                                       |
| `src/dominio/reglasLista.ts`  | `export function limpiarCambios(cambios: CambiosItem): CambiosItem` (ya existe, RF6)                                                          |
|                               | `export function transicionVistaEn(antes: EstadoVisionado, despues: EstadoVisionado): 'poner' \| 'quitar' \| 'mantener'`                      |
| `src/dominio/migraciones.ts`  | `export function obrasParaFechar(items: ItemLista[]): { itemId: string; vistaEn: number }[]`                                                  |
|                               | `export function obrasParaCompletar(items: ItemLista[], anio: number, calendario: Calendario, descartadas: ReadonlySet<string>): ItemLista[]` |
|                               | `export function accionAnteFalloTmdb(status: number \| null): 'reintentar' \| 'descartar'`                                                    |
| `src/dominio/datosTmdb.ts`    | `export function armarDatosTmdb(tipo: TipoObra, d: Pick<TmdbDetalle, 'genres' \| 'runtime' \| 'credits'>): DatosTmdb`                         |

```ts
export interface ResumenAnual {
  anio: number;
  totalObras: number;
  peliculas: number;
  series: number;
  horas: number; // con un decimal (D7)
  peliculasSinDuracion: number;
  obrasSinDatos: number; // D6
  generoTop: { nombre: string; obras: number } | null;
  directorTop: { nombre: string; obras: number } | null;
  obrasPorMes: number[]; // 12 posiciones, enero = 0 (D10)
  mesTop: number | null;
  destacada: ItemLista | null; // D11
  obrasSinFecha: number; // obras "vista" sin vistaEn, de cualquier año (P3)
}
```

Es la interfaz sugerida en 1.6 más `obrasSinFecha`. Las firmas suman el parámetro `calendario` para que el
dominio no lea la hora del sistema: la app pasa la hora local del teléfono y los tests pasan una fija.

### Reglas que implementa cada función

| Función                        | Regla                                                                                                                                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transicionVistaEn`            | Entrar a "vista" desde otro estado → `'poner'`. Salir de "vista" → `'quitar'`. Mismo estado → `'mantener'` (D1, P5).                                                                                                                                                                   |
| `resumenAnual` — obras del año | Estado "vista", `vistaEn !== null` y `calendario(vistaEn).anio === anio`. Cada `itemId` cuenta una vez (D3).                                                                                                                                                                           |
| — totales                      | `peliculas` = tipo `movie`, `series` = tipo `tv`, `totalObras` = suma.                                                                                                                                                                                                                 |
| — horas                        | Suma de `duracionMin` de las películas del año; `Math.round(minutos / 60 * 10) / 10` (D7, P15).                                                                                                                                                                                        |
| — `peliculasSinDuracion`       | Películas **completadas** (`generos !== null`) con `duracionMin === null` (D7).                                                                                                                                                                                                        |
| — `obrasSinDatos`              | Obras del año con `generos === null` (D6). No cuentan en horas, género ni director.                                                                                                                                                                                                    |
| — `generoTop`                  | Cada obra completada suma 1 a cada género. Orden: más obras; después mayor promedio exacto de calificación entre sus obras calificadas (sin calificadas = pierde, P18); después nombre con `localeCompare(x, 'es', { sensitivity: 'base' })` (D8, P2).                                 |
| — `directorTop`                | Igual que `generoTop`, solo con películas (D9). `null` si ninguna película tiene directores.                                                                                                                                                                                           |
| — `obrasPorMes` / `mesTop`     | 12 posiciones con `calendario(vistaEn).mes`. Gana el mes con más obras; empate → índice mayor. `null` si el total es 0 (D10).                                                                                                                                                          |
| — `destacada`                  | Solo obras con calificación. Mayor calificación; empate → `vistaEn` mayor; empate → título con `localeCompare` en español (D11, P1). `null` si ninguna está calificada.                                                                                                                |
| — `obrasSinFecha`              | Obras "vista" con `vistaEn === null` en toda la lista (P3).                                                                                                                                                                                                                            |
| `aniosDisponibles`             | Años de `calendario(vistaEn)` de las obras "vista" con fecha, más `anioActual`, sin repetidos, de mayor a menor (D4, P8).                                                                                                                                                              |
| `formatearHoras`               | `37.5` → `"37,5 h"`; un decimal y coma (P15).                                                                                                                                                                                                                                          |
| `obrasParaFechar`              | Obras "vista" con `vistaEn === null` y `actualizadoEn !== null` → `{ itemId, vistaEn: actualizadoEn }` (D2, P6).                                                                                                                                                                       |
| `obrasParaCompletar`           | Obras "vista" del año elegido (según `calendario`) con `generos === null` y que no estén en `descartadas` (D6, P7, P9, P19).                                                                                                                                                           |
| `accionAnteFalloTmdb`          | `404` → `'descartar'`; cualquier otro estado o `null` (sin respuesta) → `'reintentar'` (P7).                                                                                                                                                                                           |
| `armarDatosTmdb`               | `generos` = nombres de `genres`, los 10 primeros. Película: `duracionMin = runtime` si es entero entre 1 y 1000, si no `null`; `directores` = nombres de `crew` con `job === 'Director'`, sin repetir, los 10 primeros. Serie: `duracionMin = null`, `directores = []` (D5, P13, P14). |

## 4. Servicios, contexto y hook

### `src/services/firebase.ts`

- `conTiempoMaximo<T>(promesa, ms = 8000, crearError = () => new SinConexionError(...))`: el tercer parámetro es
  opcional, así las llamadas actuales no cambian.

### `src/services/tmdbService.ts`

- `pedir` lanza `TmdbError` (nueva clase exportada) con `status: number | null`. `null` = sin respuesta.
- `obtenerDetalle` agrega `datos: armarDatosTmdb(tipo, d)` a `DetalleObra`. Sigue guardando el detalle en memoria.
- **`obtenerDatosParaAgregar(tipo, id): Promise<DatosTmdb | null>`** (nueva):
  - envuelve `obtenerDetalle` con `conTiempoMaximo(…, 5000, …)`;
  - si TMDB falla o no responde en **5 s**, devuelve `null` y no lanza error;
  - si la respuesta llega después del límite, se descarta para el agregado (queda en la memoria del detalle).
- El idioma sigue siendo `IDIOMA = 'es-MX'` (P12).

### `src/services/listaService.ts`

- `normalizarItem` y `aMs` (sección 2).
- `obtener(uid)`: si `snap.metadata.fromCache` es verdadero, lanza `SinConexionError` en vez de devolver la lista
  (P17, corrige H1: ya no se guarda una lista vacía como si fuera la real).
- `agregar(uid, obra, datos: DatosTmdb | null)`: con `datos`, escribe también `generos`, `duracionMin` y
  `directores`; con `null`, no los escribe (P19).
- `actualizar(uid, itemId, cambios, vistaEn: 'poner' | 'quitar' | 'mantener')`: `'poner'` → `serverTimestamp()`;
  `'quitar'` → `null`; `'mantener'` → no se incluye el campo.
- `fecharVista(uid, itemId, ms)` (D2): `{ vistaEn: Timestamp.fromMillis(ms), actualizadoEn: serverTimestamp() }`.
- `completarDatos(uid, itemId, datos)` (D6): los 3 campos + `actualizadoEn: serverTimestamp()` (P10).
- `leerDescartadas(uid): Promise<Set<string>>` y `guardarDescartadas(uid, ids: Set<string>)`: AsyncStorage con la
  clave `cartelera:sinTmdb:{uid}` (P7).

### `src/context/CarteleraContext.tsx`

- `agregar(obra)`: espera a lo sumo 5 s por `obtenerDatosParaAgregar`. Con `null`, agrega sin datos (P19) y D6 la
  completa al abrir el resumen. Las pantallas que llaman a `agregar` muestran el botón en estado de carga mientras
  espera.
- `actualizar(itemId, cambios)`: calcula `transicionVistaEn(antes, cambios.estado)`. En la lista local pone
  `vistaEn = Date.now()` (`'poner'`), `null` (`'quitar'`) o lo deja (`'mantener'`) mientras llega la hora del
  servidor (P11). Sigue usando `limpiarCambios`.
- Nuevas acciones: `fecharVistas(cambios: { itemId: string; vistaEn: number }[])` y
  `completarObra(itemId, datos: DatosTmdb)`. Actualizan la lista local, la copia de AsyncStorage y Firestore.
- Nuevo estado: `errorLista: string | null`. En `recargar`: `SinConexionError` → `sinConexion = true`; cualquier
  otro error → `errorLista` (corrige H12).

### `src/utils/fechas.ts` (nuevo)

- `calendarioLocal: Calendario` (`new Date(ms)` → año y mes locales del teléfono) y `anioActual(): number`. Son los
  únicos lugares de la épica que usan `new Date()`.

### `src/hooks/useMiAnio.ts` (nuevo)

Devuelve: `anio`, `cambiarAnio`, `anios` (`aniosDisponibles`), `resumen` (`resumenAnual`), `progreso`
(`{ hechas: number; total: number } | null`), `sinConexion`, `error`, `cargando` y `reintentar`.

1. Empieza en `anioActual()` (D4).
2. Con conexión y la lista cargada, en cada apertura de la pestaña y en cada cambio de año:
   1. **D2:** `obrasParaFechar` → `fecharVistas` (P16: siempre antes que D6).
   2. **D6:** `obrasParaCompletar(lista, anio, calendarioLocal, descartadas)`. De una en una: `obtenerDetalle` →
      `completarObra`. El progreso avanza en cada obra. Ante `TmdbError`: `accionAnteFalloTmdb(status)`; si es
      `'descartar'`, se agrega a `descartadas` y se guarda. Ante `SinConexionError`, se detiene.
3. Sin conexión (`sinConexion`) no escribe nada: el resumen se calcula con la copia de AsyncStorage (D13).

## 5. Reglas de Firestore

`create`, `update` y las demás reglas no cambian. Así queda `itemValido`:

```
    // Reglas de negocio que también valida el servidor (RF4, RF6, épica Mi año en cine).
    function itemValido() {
      let d = request.resource.data;
      return d.keys().hasOnly(['tmdbId', 'tipo', 'titulo', 'anio', 'posterPath', 'estado',
                               'calificacionPersonal', 'comentario', 'agregadoEn', 'actualizadoEn',
                               'vistaEn', 'generos', 'duracionMin', 'directores'])
        && d.tmdbId is int
        && d.tipo in ['movie', 'tv']
        && d.titulo is string && d.titulo.size() <= 300
        && d.anio is string && d.anio.size() <= 4
        && (d.posterPath == null || d.posterPath is string)
        && d.estado in ['por_ver', 'viendo', 'vista']
        && d.comentario is string && d.comentario.size() <= 500
        && (d.calificacionPersonal == null
            || (d.estado == 'vista' && d.calificacionPersonal is int
                && d.calificacionPersonal >= 1 && d.calificacionPersonal <= 5))
        // vistaEn: solo si la obra está vista
        && (d.get('vistaEn', null) == null || (d.estado == 'vista' && d.vistaEn is timestamp))
        && (d.get('generos', []) is list && d.get('generos', []).size() <= 10)
        && (d.get('duracionMin', null) == null
            || (d.duracionMin is int && d.duracionMin > 0 && d.duracionMin <= 1000))
        && (d.get('directores', []) is list && d.get('directores', []).size() <= 10)
        && d.actualizadoEn == request.time;
    }
```

- `docs/Reglas.md` (copia, H21) se actualiza en el mismo commit.
- Las reglas se publican a mano en la consola de Firebase (T-04).

## 6. Componentes

Antes de escribir pantallas o componentes se lee DESIGN.md. Aquí se nombran sus secciones; los valores salen de
DESIGN.md y de `src/tema/`, no de esta spec.

| Pieza                                                                           | Sección de DESIGN.md                | Dónde                                  |
| ------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------- |
| `TarjetaDato` (normal y compacta, número o texto, con dato faltante, sin datos) | "Tarjeta de dato"                   | `src/components/resumen.tsx` (nuevo)   |
| `BarrasPorMes` (con `View`, etiqueta con los 12 meses)                          | "Barras por mes"                    | `src/components/resumen.tsx`           |
| `ObraDestacada` (reutiliza `Poster` y `Estrellas` de `obra.tsx`)                | "Obra destacada"                    | `src/components/resumen.tsx`           |
| `SelectorAnio` (reutiliza `Chip` de `ui.tsx`)                                   | "Selector de año", "Chip de filtro" | `src/components/resumen.tsx`           |
| `EstadoPantalla` (vacío, error, destacada sin calificar)                        | "Estado de pantalla", "Botón"       | `src/components/resumen.tsx`           |
| `IndicadorCarga` (quieto con "reducir movimiento")                              | "Indicador de carga"                | `src/components/resumen.tsx`           |
| `BarraProgreso` ("Completando 2 de 5")                                          | "Barra de progreso"                 | `src/components/resumen.tsx`           |
| `Aviso` (sin conexión, datos faltantes, obras sin fecha)                        | "Aviso", "Voz"                      | `src/components/resumen.tsx`           |
| Pantalla `MiAnioScreen`                                                         | "Pantallas" (con datos y año vacío) | `src/screens/MiAnioScreen.tsx` (nuevo) |
| Pestaña `MiAnio` entre `MiLista` y `Perfil`                                     | "Pestaña 'Mi año'"                  | `src/navigation/index.tsx`             |

- Los textos salen de DESIGN.md, sección "Voz". Los números, el año y los nombres se reemplazan por los datos
  reales.
- `AvisoSinConexion` y `EstadoVacio` de `ui.tsx` no se tocan en la épica: tienen otros textos y estilos y se revisan
  en T-11.
- Las 4 decisiones pendientes de DESIGN.md (animación de barras, título largo, más de 5 años, tamaño de "Obras
  vistas") se preguntan antes de T-09.

## 7. Resolución de los puntos abiertos

Mientras el cliente no responda, se implementa la propuesta del PRD.

| P   | Qué se implementa                                                                                                                                                                                                                                                                                                             | Dónde                                                          | Verificación                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| P1  | Empate total en la destacada: gana el título que va primero en orden alfabético                                                                                                                                                                                                                                               | `resumenAnual`                                                 | CA-A.2.29                       |
| P2  | Orden alfabético en español, sin distinguir mayúsculas ni tildes: `localeCompare(x, 'es', { sensitivity: 'base' })`                                                                                                                                                                                                           | `resumenAnual`                                                 | CA-A.2.16, CA-A.2.17, CA-A.2.21 |
| P3  | Las obras "vista" sin `vistaEn` no cuentan en ningún año; `obrasSinFecha` las cuenta y el aviso lo dice                                                                                                                                                                                                                       | `resumenAnual`, `MiAnioScreen`                                 | CA-A.5.5                        |
| P4  | El año sale de la zona horaria del teléfono al abrir (`calendarioLocal`); no se guarda la zona                                                                                                                                                                                                                                | `src/utils/fechas.ts`                                          | CA-A.2.1                        |
| P5  | Mismo estado → `'mantener'`: `vistaEn` no cambia                                                                                                                                                                                                                                                                              | `transicionVistaEn`                                            | CA-A.1.5                        |
| P6  | Sin `actualizadoEn` no se migra; `aMs` devuelve `null` (H9)                                                                                                                                                                                                                                                                   | `obrasParaFechar`, `aMs`                                       | CA-A.4.4                        |
| P7  | 404 → `'descartar'`: el `itemId` se guarda en AsyncStorage y no se vuelve a pedir, pero la obra sigue contando como "sin datos". 429 o sin respuesta → se reintenta en la próxima apertura                                                                                                                                    | `accionAnteFalloTmdb`, `obrasParaCompletar`, `leerDescartadas` | CA-A.4.9                        |
| P8  | El año actual es el del reloj del teléfono, sin corregirlo                                                                                                                                                                                                                                                                    | `anioActual`, `aniosDisponibles`                               | CA-A.3.5                        |
| P9  | **Que falte `generos` en Firestore = nunca completado** (`generos: null` en la app). Si TMDB responde sin datos se guarda `generos: []`: la obra queda completada y no se vuelve a pedir. Los 3 campos se escriben siempre juntos y nunca como `null` en las listas, así se respeta 1.6 y las reglas con `get('generos', [])` | `normalizarItem`, `obrasParaCompletar`, `completarDatos`       | CA-A.4.10                       |
| P10 | Las migraciones actualizan `actualizadoEn` como cualquier escritura; el resumen usa solo `vistaEn`                                                                                                                                                                                                                            | `fecharVista`, `completarDatos`                                | CA-A.4.5                        |
| P11 | `vistaEn = Date.now()` en la lista local hasta que Firestore devuelve la hora del servidor                                                                                                                                                                                                                                    | `CarteleraContext.actualizar`                                  | CA-A.1.6                        |
| P12 | Géneros siempre en `es-MX`                                                                                                                                                                                                                                                                                                    | `tmdbService` (`IDIOMA`)                                       | CA-A.2.8                        |
| P13 | Duración 0 o mayor que 1000 → `null`                                                                                                                                                                                                                                                                                          | `armarDatosTmdb`                                               | CA-A.2.6                        |
| P14 | Más de 10 géneros o directores → los 10 primeros                                                                                                                                                                                                                                                                              | `armarDatosTmdb`                                               | CA-A.2.7                        |
| P15 | Redondeo a un decimal y coma decimal                                                                                                                                                                                                                                                                                          | `resumenAnual`, `formatearHoras`                               | CA-A.2.10                       |
| P16 | D2 siempre antes que D6 en la misma apertura                                                                                                                                                                                                                                                                                  | `useMiAnio`                                                    | CA-A.4.11                       |
| P17 | Lista desde la caché de Firestore → `SinConexionError` → aviso de sin conexión, nunca el estado vacío (corrige H1)                                                                                                                                                                                                            | `listaService.obtener`, `CarteleraContext.recargar`            | CA-A.5.6                        |
| P18 | Promedios exactos, sin redondear                                                                                                                                                                                                                                                                                              | `resumenAnual`                                                 | CA-A.2.17                       |
| P19 | TMDB falla o tarda más de 5 s al agregar → la obra se agrega sin datos y D6 la completa después                                                                                                                                                                                                                               | `obtenerDatosParaAgregar`, `CarteleraContext.agregar`          | CA-A.2.9, CA-A.2.32, CA-A.4.12  |

## 8. Tickets y orden de commits

Primero va el commit `docs:` de esta spec (y del criterio CA-A.2.32 en el backlog). Es el documento de todos los
tickets.

**Por qué T-01 (`feat:`) va antes del `test:` de T-02**

- T-01 cambia el **modelo y los servicios** (tipos, lectura de documentos y de la copia, `aMs`), no el dominio.
- El primer commit del **dominio** es el `test:` en rojo de T-02, como pide el enunciado: "commit `test:` antes de
  `feat:` en el dominio".
- Los tests de T-02 necesitan el `ItemLista` nuevo para compilar; por eso T-01 va primero.
- En el historial: `docs:` (spec) → `feat:` T-01 (modelo) → `test:` T-02 (dominio en rojo) → `feat:` T-03 (dominio
  en verde).

| Orden | Commit                                   | Ticket | Contenido                                                                                                                                                                      |
| ----- | ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | `docs: agrega la spec de Mi año en cine` | —      | Esta spec + CA-A.2.32 en el backlog                                                                                                                                            |
| 2     | `feat:`                                  | T-01   | Tipos (sección 2), `normalizarItem`, `aMs` (H9)                                                                                                                                |
| 3     | `test:` (en rojo, caso b de AGENTS.md)   | T-02   | Tests de `resumenAnual`, `aniosDisponibles`, `formatearHoras`, `transicionVistaEn`, migraciones y `armarDatosTmdb`; funciones con la firma exacta que lanzan "no implementado" |
| 4     | `feat:`                                  | T-03   | Dominio hasta que los tests pasen                                                                                                                                              |
| 5     | `feat:`                                  | T-04   | `firestore.rules` y `docs/Reglas.md`; publicadas en la consola                                                                                                                 |
| 6     | `feat:`                                  | T-05   | `TmdbError`, `armarDatosTmdb` en `obtenerDetalle`, `obtenerDatosParaAgregar` (5 s), `agregar` con datos                                                                        |
| 7     | `feat:`                                  | T-06   | `vistaEn` en `actualizar` con `transicionVistaEn`                                                                                                                              |
| 8     | `fix:`                                   | T-07a  | `fromCache` y `errorLista` (H1, H12, P17)                                                                                                                                      |
| 9     | `feat:`                                  | T-07b  | `fecharVistas`, `completarObra`, descartadas, `useMiAnio`, `src/utils/fechas.ts`                                                                                               |
| 10    | `feat:`                                  | T-08   | `src/tema/` con los tokens de DESIGN.md; `src/theme.ts` vuelve a exportar desde ahí                                                                                            |
| 11    | `feat:`                                  | T-09   | Pantalla, componentes y pestaña                                                                                                                                                |
| 12    | `feat:`                                  | T-10   | Estados de pantalla                                                                                                                                                            |
| 13    | `fix:`                                   | T-11   | Pantallas del Proyecto 3 a tokens; se retira `src/theme.ts`; H7. El test de colores pasa a verde                                                                               |

Cada ticket cumple la Definition of Done del backlog. Mientras exista el test de colores en rojo, cada commit de
código usa el caso a) de AGENTS.md ("Tests en rojo esperados").

## 9. Criterio → verificación

Los nombres de los tests empiezan con el id del criterio, así esta tabla se puede comprobar con `grep`. Archivos:
`reglasLista.test.ts`, `resumenAnual.test.ts`, `migraciones.test.ts` y `datosTmdb.test.ts`, todos en
`src/dominio/`.

### Criterio nuevo

**CA-A.2.32** (D5, pendiente P19): DADO que el teléfono tiene red pero TMDB no responde, CUANDO agrego una obra,
ENTONCES en 5 s como máximo la obra aparece en Mi lista sin `generos`, `duracionMin` ni `directores`, y al abrir el
resumen con internet, D6 la completa. Se agrega también al backlog.

### Tabla

| CA        | Test (archivo › describe › it)                                                                                                                                       | Teléfono / Firebase                                                                                                                                                                                                                                                                                                     | Ticket      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| CA-A.1.1  | `reglasLista.test.ts` › `transicionVistaEn` › `CA-A.1.1 por ver o viendo a vista: poner`                                                                             | Firebase: marcar una obra como vista; el documento tiene `vistaEn`                                                                                                                                                                                                                                                      | T-03, T-06  |
| CA-A.1.2  | `reglasLista.test.ts` › `transicionVistaEn` › `CA-A.1.2 vista a viendo o por ver: quitar`                                                                            | Teléfono: cambiar a "viendo" y guardar. Firebase: `vistaEn` es `null`                                                                                                                                                                                                                                                   | T-03, T-06  |
| CA-A.1.3  | `reglasLista.test.ts` › `transicionVistaEn` › `CA-A.1.3 de viendo otra vez a vista: poner`                                                                           | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.1.4  | `reglasLista.test.ts` › `transicionVistaEn` › `CA-A.1.4 vista a vista con otra calificación o comentario: mantener`                                                  | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.1.5  | `reglasLista.test.ts` › `transicionVistaEn` › `CA-A.1.5 guardar sin cambiar el estado: mantener`                                                                     | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.1.6  | —                                                                                                                                                                    | Teléfono: modo avión, marcar como vista, abrir el resumen (la obra está en el año actual), quitar el modo avión. Firebase: `vistaEn` con la hora del servidor                                                                                                                                                           | T-06        |
| CA-A.1.7  | —                                                                                                                                                                    | Firebase: Rules Playground con un `update` que pone `vistaEn` y `estado: 'viendo'` → denegado                                                                                                                                                                                                                           | T-04        |
| CA-A.2.1  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.1 vista el 31/12 a las 23:30 hora local cuenta en ese año`                                                         | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.2  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.2 cada obra cuenta una vez y no cuentan las de otros años`                                                         | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.3  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.3 total = películas + series`                                                                                      | Teléfono: comparar con un conteo a mano en Mi lista                                                                                                                                                                                                                                                                     | T-03, T-09  |
| CA-A.2.4  | `datosTmdb.test.ts` › `armarDatosTmdb` › `CA-A.2.4 película: géneros, duración y directores`                                                                         | Teléfono: agregar una película. Firebase: el documento tiene los 3 campos                                                                                                                                                                                                                                               | T-03, T-05  |
| CA-A.2.5  | `datosTmdb.test.ts` › `armarDatosTmdb` › `CA-A.2.5 serie: duracionMin null y directores vacío`                                                                       | Teléfono: agregar una serie. Firebase: los 3 campos con esos valores                                                                                                                                                                                                                                                    | T-03, T-05  |
| CA-A.2.6  | `datosTmdb.test.ts` › `armarDatosTmdb` › `CA-A.2.6 duración 0 o mayor que 1000: null`                                                                                | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.7  | `datosTmdb.test.ts` › `armarDatosTmdb` › `CA-A.2.7 más de 10 géneros o directores: los 10 primeros`                                                                  | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.8  | —                                                                                                                                                                    | Teléfono: agregar una película de ciencia ficción. Firebase: el género dice "Ciencia ficción"                                                                                                                                                                                                                           | T-05        |
| CA-A.2.9  | — (lógica de servicio)                                                                                                                                               | Teléfono: buscar una película, activar el modo avión y tocar Agregar; la obra aparece en Mi lista. Firebase: al reconectar, el documento no tiene los 3 campos                                                                                                                                                          | T-05        |
| CA-A.2.10 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.10 2250 minutos son 37,5 h` y `formatearHoras` › `CA-A.2.10 37,5 se escribe con coma`                              | Teléfono: la tarjeta de horas usa coma                                                                                                                                                                                                                                                                                  | T-03, T-09  |
| CA-A.2.11 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.11 las series no suman horas`                                                                                      | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.12 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.12 película sin duración: no suma y cuenta en peliculasSinDuracion`                                                | Teléfono: la tarjeta de horas lo indica                                                                                                                                                                                                                                                                                 | T-03, T-10  |
| CA-A.2.13 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.13 gana el género con más obras`                                                                                   | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.14 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.14 empate de géneros: gana el de mayor promedio`                                                                   | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.15 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.15 empate de géneros: el que no tiene calificadas pierde`                                                          | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.16 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.16 empate sin calificadas: orden alfabético`                                                                       | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.17 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.17 mismo promedio exacto: Acción antes que Animación`                                                              | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.18 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.18 las series suman géneros`                                                                                       | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.19 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.19 solo cuentan los directores de películas`                                                                       | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.20 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.20 empate de directores: gana el de mayor promedio`                                                                | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.21 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.21 empate total de directores: orden alfabético`                                                                   | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.22 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.22 sin directores: directorTop null`                                                                               | Teléfono: año con solo series → la tarjeta del director dice que no hay datos suficientes                                                                                                                                                                                                                               | T-03, T-10  |
| CA-A.2.23 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.23 gana el mes con más obras`                                                                                      | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.24 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.24 empate de meses: gana el más reciente`                                                                          | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.25 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.25 obrasPorMes tiene siempre 12 posiciones`                                                                        | Teléfono: se ven 12 barras, con las vacías                                                                                                                                                                                                                                                                              | T-03, T-09  |
| CA-A.2.26 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.26 año sin obras: mesTop null y 12 ceros`                                                                          | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.27 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.27 la destacada es la de mayor calificación`                                                                       | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.28 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.28 empate de calificación: gana la vista más reciente`                                                             | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.29 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.29 mismo vistaEn: gana el título en orden alfabético`                                                              | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.30 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.30 una obra sin calificar no le gana a una con 1`                                                                  | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.2.31 | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.2.31 ninguna calificada: destacada null`                                                                             | Teléfono: año sin calificaciones → la tarjeta invita a calificar                                                                                                                                                                                                                                                        | T-03, T-10  |
| CA-A.2.32 | — (lógica de servicio)                                                                                                                                               | Teléfono: punto de acceso de otro teléfono con sus datos móviles apagados (Wi-Fi sin internet); con los resultados de Buscar ya cargados, conectarse y tocar Agregar → la obra aparece en Mi lista en 5 s o menos. Firebase: al volver a internet, el documento no tiene los 3 campos; al abrir el resumen, se completa | T-05        |
| CA-A.3.1  | `resumenAnual.test.ts` › `aniosDisponibles` › `CA-A.3.1 años con obras vistas más el actual, de mayor a menor`                                                       | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.3.2  | `resumenAnual.test.ts` › `aniosDisponibles` › `CA-A.3.2 el año actual aparece aunque no tenga obras`                                                                 | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.3.3  | `resumenAnual.test.ts` › `aniosDisponibles` › `CA-A.3.3 el año actual no se repite`                                                                                  | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.3.4  | —                                                                                                                                                                    | Teléfono: abrir la pestaña Mi año; el chip del año actual está seleccionado                                                                                                                                                                                                                                             | T-09        |
| CA-A.3.5  | `resumenAnual.test.ts` › `aniosDisponibles` › `CA-A.3.5 año actual en el futuro: aparece igual`                                                                      | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.3.6  | —                                                                                                                                                                    | Teléfono: elegir en el selector un año sin obras vistas → estado vacío                                                                                                                                                                                                                                                  | T-10        |
| CA-A.4.1  | `migraciones.test.ts` › `obrasParaFechar` › `CA-A.4.1 vista sin vistaEn recibe actualizadoEn`                                                                        | Firebase: anotar `actualizadoEn` de una obra vista sin `vistaEn`, abrir la pestaña y comparar                                                                                                                                                                                                                           | T-03, T-07b |
| CA-A.4.2  | `migraciones.test.ts` › `obrasParaFechar` › `CA-A.4.2 después de migrar no queda nada por fechar`                                                                    | Firebase: en la segunda apertura `actualizadoEn` no cambia                                                                                                                                                                                                                                                              | T-03, T-07b |
| CA-A.4.3  | `migraciones.test.ts` › `obrasParaFechar` › `CA-A.4.3 no toca obras no vistas ni las que ya tienen fecha`                                                            | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.4.4  | `migraciones.test.ts` › `obrasParaFechar` › `CA-A.4.4 sin actualizadoEn no se migra`                                                                                 | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.4.5  | —                                                                                                                                                                    | Firebase: comparar `actualizadoEn` de una obra antes y después de que la migren                                                                                                                                                                                                                                         | T-07b       |
| CA-A.4.6  | `migraciones.test.ts` › `obrasParaCompletar` › `CA-A.4.6 elige las obras vistas del año sin datos`                                                                   | Teléfono: con 2 o más obras sin datos, ver el progreso "Completando 1 de N…"                                                                                                                                                                                                                                            | T-03, T-10  |
| CA-A.4.7  | `migraciones.test.ts` › `obrasParaCompletar` › `CA-A.4.7 no elige obras de otros años`                                                                               | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.4.8  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.4.8 obra sin datos: cuenta en el total, no en horas, género ni director`                                             | Firebase: crear en la consola una obra "vista" de este año con `tmdbId` 999999999 y sin los 3 campos. Teléfono: el resumen dice "1 obra se quedó sin datos de TMDB"                                                                                                                                                     | T-03, T-10  |
| CA-A.4.9  | `migraciones.test.ts` › `accionAnteFalloTmdb` › `CA-A.4.9 404 descarta; 429 y sin respuesta reintentan` y `obrasParaCompletar` › `CA-A.4.9 no elige las descartadas` | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.4.10 | `migraciones.test.ts` › `obrasParaCompletar` › `CA-A.4.10 con generos vacío no se vuelve a pedir`                                                                    | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.4.11 | — (lógica del hook)                                                                                                                                                  | Teléfono: en la consola, quitar `vistaEn` y los 3 campos de una obra vista de este año; abrir la pestaña. Firebase: la obra queda con `vistaEn` y con los 3 campos                                                                                                                                                      | T-07b       |
| CA-A.4.12 | `migraciones.test.ts` › `obrasParaCompletar` › `CA-A.4.12 una obra agregada sin datos entra en la selección`                                                         | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.5.1  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.5.1 año sin obras vistas: totalObras 0`                                                                              | Teléfono: tocar "Ir a Mi lista" en un año vacío → se abre Mi lista                                                                                                                                                                                                                                                      | T-03, T-10  |
| CA-A.5.2  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.5.2 obras por ver o viendo no cuentan`                                                                               | —                                                                                                                                                                                                                                                                                                                       | T-03        |
| CA-A.5.3  | —                                                                                                                                                                    | Teléfono: abrir la app con conexión, activar el modo avión y abrir la pestaña → resumen con el aviso "Estás sin conexión…"                                                                                                                                                                                              | T-10        |
| CA-A.5.4  | —                                                                                                                                                                    | Teléfono: modo avión y abrir la pestaña → no aparece el progreso. Firebase: los documentos no cambian                                                                                                                                                                                                                   | T-07b       |
| CA-A.5.5  | `resumenAnual.test.ts` › `resumenAnual` › `CA-A.5.5 obras vistas sin fecha: obrasSinFecha`                                                                           | Teléfono: sin conexión, el aviso dice cuántas obras faltan                                                                                                                                                                                                                                                              | T-03, T-10  |
| CA-A.5.6  | —                                                                                                                                                                    | Teléfono: modo avión, cerrar la app por completo, abrirla y entrar a la pestaña → aviso de sin conexión, no "año vacío"                                                                                                                                                                                                 | T-07a       |
| CA-A.5.7  | —                                                                                                                                                                    | Teléfono: entrar a la pestaña recién abierta la app → se ve "Armando tu año…"                                                                                                                                                                                                                                           | T-10        |
| CA-A.5.8  | —                                                                                                                                                                    | Teléfono: publicar por un momento una regla que niega la lectura de `mi_lista`, abrir la pestaña → "Uy, no pudimos cargar tu resumen" con "Reintentar"; restaurar la regla                                                                                                                                              | T-07a, T-10 |
| CA-A.5.9  | —                                                                                                                                                                    | Teléfono: año con una obra sin datos (CA-A.4.8) y una película completada sin duración → se ven los dos mensajes                                                                                                                                                                                                        | T-10        |
