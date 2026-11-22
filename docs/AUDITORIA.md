# Auditoría de requisitos — Cinta · Mi Cartelera Personal

Auditoría inicial: 21 de noviembre de 2026

## 1. Origen de los requisitos

El repositorio no incluía un `SPEC.md`. Los requisitos usados en esta auditoría son los RF1–RF10 del
enunciado del Proyecto 3 (sección 1.4), junto con sus criterios de aceptación, más tres restricciones
del mismo enunciado: `.env` fuera del repositorio, tres estados (cargando / error / éxito) en cada
petición y elementos tocables de al menos 44 px.

Método: lectura completa de `src/`, `firestore.rules`, `app.json`, `package.json`, `README.md` y
`AGENTS.md`; `npx tsc --noEmit` y `npx eslint .` (ambos sin errores); búsqueda de `any`,
`@ts-ignore` y `eslint-disable` (ninguno); revisión del historial de Git para `.env`.

## 2. Cumplimiento

| RF | Criterio | ¿Cumple? | Evidencia |
|---|---|---|---|
| RF1 | Registro, inicio y cierre de sesión; la sesión persiste; errores traducidos | Sí | `src/services/firebase.ts` → `auth` (`initializeAuth` + `getReactNativePersistence(AsyncStorage)`); `src/services/authService.ts` → `registrar`, `iniciarSesion`, `cerrarSesion`, `traducirErrorAuth` (tabla `MENSAJES`); `src/components/ui.tsx` → `confirmarCerrarSesion`; `src/context/CarteleraContext.tsx` → efecto con `escucharSesion` (devuelve la limpieza); `src/navigation/index.tsx` → `Navegacion` espera `iniciando` |
| RF2 | Búsqueda por título con carátula, título y año; carga, error y sin resultados | Sí | `src/services/tmdbService.ts` → `buscar` (`/search/multi`, descarta personas, revisa `res.ok`, 401 y 429); `src/screens/BuscarScreen.tsx` → efecto con *debounce* de 400 ms y ramas `inactivo` / `cargando` / `error` (con Reintentar) / `exito` vacío; `TarjetaResultado` (Poster, título, año) |
| RF3 | Detalle con póster, sinopsis, nota TMDB y elenco; tolera póster o sinopsis faltantes | Sí | `tmdbService.ts` → `obtenerDetalle` (`append_to_response=credits,videos`); `src/screens/DetalleScreen.tsx`; `src/components/obra.tsx` → `Poster` (relleno "Sin póster"), `TarjetaSinopsis` (texto de relleno), `TarjetaElenco` ("Sin datos de elenco") |
| RF4 | Crea el documento con estado inicial; sin duplicados | Sí | `CarteleraContext.tsx` → `agregar` (`estado: 'por_ver'`, revisa si el id ya existe); `src/services/listaService.ts` → `agregar` + `crearItemId` (`tipo_tmdbId`); `firestore.rules` → `create` exige `itemId == tipo + '_' + tmdbId` y `update` no permite cambiar `agregadoEn`, así que no se puede sobrescribir |
| RF5 | Filtro por estado y por tipo | Sí | `src/screens/MiListaScreen.tsx` → `visibles` (`useMemo`) + chips `ESTADOS` y `TIPOS` |
| RF6 | Estado, nota 1–5, comentario ≤ 500; solo se califica con "vista" | Sí | `src/screens/EditarScreen.tsx` → estrellas con `disabled={!puedeCalificar}`, `Comentario` con `maxLength=500`; `CarteleraContext.tsx` → `actualizar` (anula la nota si no está "vista", `slice(0, 500)`); `firestore.rules` → `itemValido` (nota entera 1–5 solo con `estado == 'vista'`, comentario ≤ 500). Ver H8 |
| RF7 | Confirmación antes de borrar | Sí | `EditarScreen.tsx` → `confirmarEliminar` (`Alert.alert` con Cancelar / Quitar `destructive`). Es la única vía de borrado |
| RF8 | Firestore + copia en AsyncStorage; sin internet, última copia con aviso | Parcial | `listaService.ts` → `guardarCacheLista` / `leerCacheLista`; `CarteleraContext.tsx` → efecto inicial (primero la copia, luego `recargar`); `MiListaScreen.tsx` → `AvisoSinConexion`. Falla en el caso descrito en H1 (y H6) |
| RF9 | Atribución y logo de TMDB, y cierre de sesión | Sí | `src/screens/CreditosScreen.tsx` → `AvisoTmdb` (logo `assets/tmdb.svg` + texto obligatorio) y botón "Cerrar sesión"; `PerfilScreen.tsx` también muestra `AvisoTmdb` |
| RF10 | TypeScript por capas, sin `any` innecesarios, claves fuera del repo | Sí | `tsconfig.json` → `strict: true`; ningún `any` explícito; solo `src/services/` usa Firebase, `fetch` y AsyncStorage (ninguna pantalla los importa); `.env` ignorado. Ver los riesgos H5 y H17 |
| R1 | `.env` fuera del repositorio | Sí | `.gitignore` línea 34 (`.env`); `git ls-tree origin/master` solo contiene `.env.example` (sin valores); `git log --all -- .env` está vacío |
| R2 | Tres estados en cada petición | Parcial | `src/hooks/usePeticion.ts` y `BuscarScreen.tsx` cubren los tres estados. Faltan casos: ver H10, H12 y H14 |
| R3 | Elementos tocables de al menos 44 px | Sí | `src/theme.ts` → `TOQUE = 44`; `ui.tsx` → `boton` minHeight 52, `iconoBoton` 44×44, `chip` / `segmento` / `avisoBoton` minHeight 44, `ojo` 52×52; `EditarScreen` → `estrella` 52×52; `PerfilScreen` → `fila` minHeight 56; `BuscarScreen` → `borrar` / `guardar` 44×44; barra de pestañas de 70 px |

## 3. Hallazgos

| Id | Hallazgo | Evidencia | Gravedad | Decisión |
|---|---|---|---|---|
| H1 | Sin red, la lista puede quedar vacía y borrar la copia local. `getDocs` no falla sin conexión: devuelve lo que tenga la caché en memoria de Firestore, que al abrir la app en frío está vacía. La app lo toma como éxito, guarda `[]` en AsyncStorage y no muestra el aviso. Por la misma causa, si se pierde la red con la app abierta, "recargar" tampoco muestra el aviso | `src/services/listaService.ts` → `obtener` (no revisa `snap.metadata.fromCache`); `CarteleraContext.tsx` → `recargar` → `fijarLista` (guarda la copia); en cambio, `perfilService.ts` → `escucharPerfil` sí revisa `fromCache` | Alta | Corregir ahora en T-07a (spec 01, P17) |
| H2 | `app.json` y el README apuntan a la cuenta de Expo del grupo, así que un `eas build` o `eas update` se publicaría en el proyecto del grupo | `app.json` → `"owner": "w4730"`, `extra.eas.projectId: "f5e2edce-…"`, `android.package: "com.w4730.filmjournal"`; `README.md` → "enlazado a EAS (`@w4730/mi-cartelera`)" | Alta | Corregir ahora (requiere una cuenta de Expo propia y `eas init`) |
| H3 | `AGENTS.md` describe Expo Router (`src/app/`, `_layout.tsx`, `Link`, `useLocalSearchParams`), pero la app usa React Navigation | `AGENTS.md` → sección "Navigation & Routing"; `src/navigation/index.tsx` → `createNativeStackNavigator` / `createBottomTabNavigator`; `src/app/` no existe; `expo-router` no está en `package.json` | Media | Corregir ahora |
| H4 | No hay pruebas automáticas ni script `test` | `package.json` → `scripts` sin `test`; no hay jest ni archivos `*.test.*` / `*.spec.*`; no existe `.github/` | Media | Corregir ahora |
| H5 | El token de TMDB queda dentro del paquete de la app (cualquier variable `EXPO_PUBLIC_*` es visible) | `src/services/tmdbService.ts` → `pedir` (`process.env.EXPO_PUBLIC_TMDB_TOKEN`); está documentado en `README.md`, "Variables de entorno" | Media | Riesgo conocido (la solución completa es un proxy en un servidor propio) |
| H6 | Las escrituras sin conexión solo se guardan en la memoria de Firestore. Si se cierra la app antes de reconectar, se pierden, aunque la copia en AsyncStorage las siga mostrando hasta la siguiente recarga | `src/services/firebase.ts` → `getFirestore(app)` (caché en memoria; React Native no tiene IndexedDB); `CarteleraContext.tsx` → `mutar` (ante `SinConexionError` conserva el cambio y lo guarda en la copia) | Media | Riesgo conocido |
| H7 | Hay colores en hexadecimal fuera de `src/theme.ts` | `src/context/AccesibilidadContext.tsx` línea 39 → `backgroundColor: '#000'` (vista mientras `!listo`) | Media | Corregir ahora (se resuelve al pasar todo a `src/tema/` en el Hito 4) |
| H8 | La regla de RF6 (anular la nota si el estado no es "vista" y recortar el comentario a 500) vive dentro de `CarteleraContext.actualizar`, así que no se puede probar sin React | `src/context/CarteleraContext.tsx` → `actualizar` (líneas 150–151: `cambios.estado === 'vista' ? … : null` y `comentario.trim().slice(0, 500)`) | Media | Corregir ahora, extrayéndola a una función pura en `src/dominio/` |
| H9 | `aMs()` devuelve `Date.now()` cuando falta una fecha. Para la épica (D2: `vistaEn = actualizadoEn`), una obra antigua podría quedar con la fecha de hoy | `src/services/listaService.ts` línea 32 → `aMs` (`t?.toMillis() ?? Date.now()`), usada en `aItem` para `agregadoEn` y `actualizadoEn` | Media | Corregir ahora en el Hito 3 |
| H10 | Editar y Perfil no muestran carga ni error del detalle de TMDB: la sinopsis, el elenco y la tarjeta "Agregada recientemente" simplemente no aparecen | `EditarScreen.tsx` → `usePeticion` (solo usa `exito`); `PerfilScreen.tsx` → `usePeticion` (solo `exito`) | Baja | Corregir ahora en Editar; Perfil se deja así (es decorativo) |
| H11 | El elenco usa el id de la persona como `key`; si un actor tiene dos papeles en la misma obra, se repite la key y aparece la advertencia de React | `src/components/obra.tsx` → `TarjetaElenco` (`key={p.id}`); `tmdbService.ts` → `obtenerDetalle` (mapea `id: c.id`, no `credit_id`) | Baja | Corregir ahora |
| H12 | Cualquier error al cargar la lista se muestra como "Sin conexión", aunque sea, por ejemplo, `permission-denied` | `CarteleraContext.tsx` → `recargar` (`catch` → `setSinConexion(true)`) | Baja | Corregir ahora en T-07a (spec 01) |
| H13 | Durante los 400 ms del *debounce* se siguen viendo los resultados de la búsqueda anterior ("Sin resultados para «nuevo texto»" puede aparecer con datos viejos), y `cargarMas` puede pedir la página 2 del texto nuevo y sumarla a los resultados viejos | `BuscarScreen.tsx` → `peticion` (deriva de `guardada`, que no se limpia al cambiar el texto) y `cargarMas` (usa `consulta` actual con `actual.pagina + 1`) | Baja | Riesgo conocido (se corrige solo al llegar la nueva respuesta) |
| H14 | Si falla la carga de la página siguiente, no se avisa al usuario | `BuscarScreen.tsx` → `cargarMas` (`catch {}` vacío) | Baja | Riesgo conocido |
| H15 | No hay un script para el chequeo de tipos | `package.json` → `scripts` (solo `lint`); hay que ejecutar `npx tsc --noEmit` a mano | Baja | Corregir ahora (junto con H4) |
| H16 | No hay Prettier configurado | No existe `.prettierrc*` ni `prettier.config.*`; `prettier` no está en `package.json` | Baja | Corregir ahora (paso 4 del harness) |
| H17 | Los datos externos se usan sin validarlos al ejecutar la app: `DocumentData` de Firestore tiene tipo `any` implícito y las respuestas de TMDB y AsyncStorage se convierten con `as T` | `listaService.ts` → `aItem` (`snap.data()`); `perfilService.ts` → `escucharPerfil`; `tmdbService.ts` → `pedir` (`as T`); `src/services/cache.ts` → `leerCache` (`as T`) | Baja | Riesgo conocido |
| H18 | La URL base de las imágenes de TMDB está fija en el código, en vez de pedirse a `/configuration` | `tmdbService.ts` → constante `IMAGENES` (con un comentario que lo reconoce) | Baja | Riesgo conocido |
| H19 | Cualquiera, incluso sin sesión, puede consultar un nombre de usuario y obtener el uid asociado | `firestore.rules` → `match /nombresUsuario/{usuario}` → `allow get: if true` (lo necesita `authService.ts` → `registrar` → `usuarioDisponible` antes de crear la cuenta) | Baja | Riesgo conocido (no expone datos personales; no se puede listar) |
| H20 | Al cerrar sesión, la copia local de la lista y del perfil (con foto) queda guardada en el teléfono | `listaService.ts` → `guardarCacheLista` (`cartelera:lista:{uid}`); `perfilService.ts` → `guardarCachePerfil`; `authService.ts` → `cerrarSesion` no las borra | Baja | Riesgo conocido |
| H21 | `docs/Reglas.md` es una copia manual de `firestore.rules`; hoy son idénticas, pero pueden desincronizarse | `diff -w` entre `firestore.rules` (cuerpo) y `docs/Reglas.md`: sin diferencias | Baja | Riesgo conocido |
| H22 | En la web, `Alert.alert` con botones no funciona, así que no se puede quitar una obra ni cerrar sesión | `EditarScreen.tsx` → `confirmarEliminar`; `ui.tsx` → `confirmarCerrarSesion`; `package.json` → script `web` | Baja | Fuera de alcance (la app es móvil) |
| H23 | El comentario puede quedar terminando en espacio si el carácter 500 es un espacio | `src/dominio/reglasLista.ts` → `limpiarCambios` (`trim()` antes de `slice(0, 500)`) | Baja | Riesgo conocido |
| H24 | `slice` cuenta unidades UTF-16; un emoji en la posición 500 puede quedar partido | `src/dominio/reglasLista.ts` → `limpiarCambios` (`slice(0, 500)`) | Baja | Riesgo conocido |

## Seguimiento

21/11/2026 — Paso 5: H4, H8 y H15 resueltos (Vitest, scripts test/typecheck y limpiarCambios en src/dominio con 8 pruebas).

21/11/2026 — La spec 01 incluye en su alcance H1, H7, H9 y H12.

21/11/2026 — T-11: H7 cerrado; el test de colores fijos pasa y se cierra el caso a de Tests en rojo esperados.

## 4. Cierre

Pendiente: se completa en el Hito 4.
