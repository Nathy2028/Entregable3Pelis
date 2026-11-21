# PRD — Épica "Mi año en cine"

- **App:** Cinta · Mi Cartelera Personal
- **Fecha:** 21/11/2026
- **Estado:** Borrador para revisión
- **Fuentes:** `docs/ENUNCIADO.md` (secciones 1.3 a 1.6 y 1.10), `docs/AUDITORIA.md`, `README.md`

## 1. Problema y objetivo

**Problema.** La app sabe qué obras están en "vista", pero no cuándo se vieron, y no guarda sus géneros, su
duración ni su director. Por eso no puede responder una pregunta simple: "¿qué vi este año?".

**Objetivo.** Agregar una pantalla nueva, accesible desde una pestaña, donde el usuario ve el resumen de lo que
vio en un año:

- obras vistas en el año, con cuántas son películas y cuántas series;
- horas de cine (películas);
- género más visto y director más visto;
- mes más activo, con una barra por mes;
- obra destacada: la mejor calificada del año;
- selector de año.

Para que el resumen sea posible, la app empieza a guardar cuándo se vio cada obra y algunos datos de TMDB que hoy
no guarda (géneros, duración y director). Las obras que ya estaban en la lista se completan sin perder nada.

## 2. Usuarios y escenario de uso

**Usuario.** La misma persona que ya usa Cinta para llevar su lista de películas y series. Cada cuenta es de una
sola persona y su lista es privada.

**Escenarios.**

1. A fin de año abre la pestaña "Mi año en cine" y ve su resumen del año actual.
2. Cambia a un año anterior con el selector para comparar.
3. Tiene obras marcadas como vistas antes de esta épica. La primera vez que abre la pestaña, esas obras reciben
   su fecha y sus datos de TMDB, con el progreso visible.
4. Abre la pestaña sin conexión y ve el resumen calculado con la copia guardada en el teléfono, con un aviso.

## 3. Alcance y fuera de alcance

**Dentro del alcance**

- La pestaña y la pantalla "Mi año en cine".
- Los cuatro campos nuevos de cada obra: `vistaEn`, `generos`, `duracionMin` y `directores`.
- Guardar los datos de TMDB al agregar una obra (D5).
- Las migraciones de las obras existentes: fechas (D2) y datos de TMDB (D6).
- Las reglas de Firestore actualizadas para los campos nuevos.
- Las funciones de dominio (`resumenAnual`, `aniosDisponibles`) probadas con Vitest.
- Los estados de pantalla: carga, vacío, error, sin conexión y datos faltantes.

**Fuera del alcance**

- Revisionados: cada obra cuenta una sola vez (D3).
- Librerías de gráficas: las barras por mes se construyen con `View`.
- Editar `vistaEn` a mano.
- Compartir o exportar el resumen.
- Comparar el resumen con otras cuentas.
- La versión web de la app (ver H22 en la auditoría).
- Lógica en un servidor propio (por ejemplo, Cloud Functions).

## 4. Historias de usuario

Se refinan con criterios DADO / CUANDO / ENTONCES en `docs/backlog/`.

| Id     | Historia                                                                          | Idea central del criterio                                                               |
| ------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| HU-A.1 | Como usuario, quiero que la app recuerde cuándo vi cada obra                      | Marcar como vista guarda la fecha; dejar de estar vista la borra                        |
| HU-A.2 | Como usuario, quiero ver mi resumen del año                                       | Totales, horas, género, director, mes más activo y obra destacada                       |
| HU-A.3 | Como usuario, quiero cambiar de año                                               | El selector muestra solo años con obras vistas, más el actual                           |
| HU-A.4 | Como usuario, quiero ver mi resumen aunque mis obras sean anteriores a esta épica | Las obras ya vistas reciben fecha y datos de TMDB sin perder nada                       |
| HU-A.5 | Como usuario, quiero entender un resumen vacío o incompleto                       | Estados de carga, vacío, error, sin conexión y datos faltantes, cada uno con su mensaje |

## 5. Reglas de negocio

Decisiones del cliente, copiadas tal cual de la sección 1.5 del enunciado.

| #   | Tema                             | Decisión                                                                                                                                                                                                                                                                 |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Fecha de visionado               | Nuevo campo vistaEn. Se guarda con serverTimestamp cuando la obra pasa a vista. Si deja de estar vista, vuelve a null; si vuelve a vista, toma la fecha nueva. Editar calificación o comentario no la cambia                                                             |
| D2  | Obras vistas antes de esta épica | Al abrir Mi año en cine, las obras en vista sin vistaEn reciben vistaEn = actualizadoEn. Se hace una sola vez y se guarda en Firestore                                                                                                                                   |
| D3  | A qué año pertenece una obra     | Al año calendario de vistaEn en la hora local del teléfono. Cada obra cuenta una sola vez: no hay revisionados                                                                                                                                                           |
| D4  | Años del selector                | Los años con al menos una obra vista, más el año actual, del más reciente al más antiguo. Se abre en el año actual                                                                                                                                                       |
| D5  | Datos de TMDB                    | Al agregar una obra se guardan generos (nombres en español), duracionMin (solo películas; en series es null) y directores (solo películas; en series es una lista vacía)                                                                                                 |
| D6  | Obras guardadas sin esos datos   | Al abrir el resumen se completan desde TMDB las obras vistas del año elegido que no los tengan, de una en una y con progreso visible. Si TMDB falla para una obra, cuenta en el total pero no en horas, género ni director, y el resumen dice cuántas quedaron sin datos |
| D7  | Horas de cine                    | Suma de duracionMin de las películas vistas, en horas con un decimal (37,5 h). Las series cuentan como obras, no en horas. Una película sin duración no suma y el resumen lo indica                                                                                      |
| D8  | Género más visto                 | Cada obra suma 1 a cada uno de sus géneros. Gana el que tenga más obras. Empate: mayor promedio de calificación personal entre sus obras calificadas (sin calificadas pierde). Si persiste: orden alfabético                                                             |
| D9  | Director más visto               | Solo películas; cada director suma 1. Mismo desempate que D8. Si ninguna película tiene director, la tarjeta dice que no hay datos suficientes                                                                                                                           |
| D10 | Mes más activo                   | El mes con más obras vistas. Empate: el más reciente. Se muestran los 12 meses del año, también los que tienen 0                                                                                                                                                         |
| D11 | Obra destacada                   | La de mayor calificación personal. Empate: la de vistaEn más reciente. Si no hay obras calificadas, la tarjeta invita a calificar                                                                                                                                        |
| D12 | Resumen vacío                    | Un año sin obras vistas muestra un estado vacío con el botón Ir a Mi lista                                                                                                                                                                                               |
| D13 | Sin conexión                     | El resumen se calcula con la copia de AsyncStorage y muestra un aviso. Sin conexión no se completan datos ni se migran fechas                                                                                                                                            |

Ninguna de estas reglas debe vivir en una pantalla. Todas se calculan en funciones de dominio puras, probadas con
Vitest (ver 1.7 del enunciado).

## 6. Cambios al modelo de datos

La ruta no cambia: `usuarios/{uid}/mi_lista/{itemId}`. Se agregan cuatro campos a cada documento:

| Campo         | Tipo                   | Descripción                                              | Decisión |
| ------------- | ---------------------- | -------------------------------------------------------- | -------- |
| `vistaEn`     | marca de tiempo o nulo | Cuándo pasó a vista                                      | D1, D2   |
| `generos`     | lista de texto         | Nombres de género de TMDB en español, máximo 10          | D5, D8   |
| `duracionMin` | número o nulo          | Duración en minutos; null en series o si TMDB no la trae | D5, D7   |
| `directores`  | lista de texto         | Directores de la película, máximo 10; vacía en series    | D5, D9   |

### Cómo afecta a `firestore.rules`

1. **Lista de campos permitidos.** Hoy `itemValido` usa `keys().hasOnly([...])` con los 10 campos actuales. Si
   no se agregan `vistaEn`, `generos`, `duracionMin` y `directores` a esa lista, Firestore rechaza cualquier
   escritura que los incluya.
2. **Validación de los campos nuevos.** Se agregan las condiciones de la sección 1.6 del enunciado. Leen cada
   campo con `get(campo, valorPorDefecto)`, así los documentos viejos que todavía no los tienen siguen siendo
   válidos:
   - `vistaEn` solo puede tener valor si la obra está en "vista", y debe ser una marca de tiempo;
   - `generos` y `directores` son listas de 10 elementos como máximo;
   - `duracionMin` es nulo o un entero mayor que 0 y menor o igual que 1000.
3. **`actualizadoEn` en cada escritura.** La regla de `update` exige `actualizadoEn == request.time`. Por eso las
   migraciones de D2 y D6 también cambian `actualizadoEn` (ver P10).
4. **Fecha de `vistaEn`.** La regla no exige que `vistaEn` sea `request.time`, porque D2 necesita guardar una
   fecha anterior (`actualizadoEn`). El servidor no impide escribir otra fecha: lo garantiza la app siguiendo D1.
5. **Copia de las reglas.** `docs/Reglas.md` es una copia manual de `firestore.rules` (H21) y se actualiza junto
   con ella.

### En la app

- `ItemLista` suma los cuatro campos.
- Las copias guardadas en AsyncStorage antes de la épica no los tienen, así que se leen con valores por defecto.
- La lógica del resumen vive en `src/dominio/`, sin Firebase ni fechas del sistema. La firma sugerida en la
  sección 1.6 del enunciado (`ResumenAnual`, `aniosDisponibles(items, anioActual)` y `resumenAnual(items, anio)`)
  se detalla en la spec.

## 7. Métricas de éxito

Se miden dentro del proyecto, no con usuarios reales.

| Métrica                              | Cómo se comprueba                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Las reglas de negocio están probadas | Cada decisión que es lógica (D3 a D11) tiene al menos un test; `npm test` y `npx tsc --noEmit` pasan                       |
| Todas las obras vistas tienen fecha  | Después de abrir la pestaña una vez con conexión, el 100 % de las obras "vista" tienen `vistaEn` en la consola de Firebase |
| Los datos de TMDB se completan       | Después de completar con conexión, `obrasSinDatos` es 0, salvo las obras en que TMDB falló, y el resumen dice cuántas son  |
| El resumen es correcto               | Los números coinciden con un conteo a mano en el teléfono para un año de prueba (en `docs/VERIFICACION.md`)                |
| Las reglas protegen los datos        | Una escritura con `duracionMin: -5` es rechazada y dos cuentas siguen aisladas                                             |
| Todo criterio tiene verificación     | Ningún criterio del backlog queda sin test o sin prueba en el teléfono                                                     |

## 8. Puntos abiertos

Estos puntos no se consultaron con el cliente antes de la implementación. Mientras no haya respuesta, se aplica la propuesta de cada uno y los criterios que dependen de ella se marcan (pendiente P#) en el backlog.

Casos que D1 a D13 no cubren. La propuesta es solo una sugerencia para consultar con el cliente, no una decisión.

| #   | Decisión        | Caso                                                                                                                                           | Por qué importa                                                                                           | Propuesta                                                                                                                       |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| P1  | D11             | Dos obras con la misma calificación y exactamente el mismo `vistaEn`                                                                           | La destacada no queda definida y el resultado podría cambiar según el orden de la lista                   | Desempatar por título en orden alfabético                                                                                       |
| P2  | D8, D9          | El orden alfabético, ¿distingue tildes y mayúsculas? ("Acción" contra "Animación", "drama" contra "Drama")                                     | Comparar texto de forma simple ordena las mayúsculas y las tildes de forma distinta al español            | Comparar en español sin distinguir mayúsculas ni tildes                                                                         |
| P3  | D13             | Sin conexión, ¿cuentan en el resumen las obras "vista" que todavía no tienen `vistaEn`?                                                        | Sin fecha no se sabe a qué año pertenecen, y la migración de D2 no corre sin conexión                     | No cuentan en ningún año, y el aviso dice cuántas faltan                                                                        |
| P4  | D3              | Si el usuario cambia la zona horaria del teléfono, una obra vista cerca del 31/12 o del 1/1 puede cambiar de año                               | El mismo resumen da números distintos según dónde esté el teléfono                                        | El año se calcula con la zona horaria que tenga el teléfono al abrir el resumen; la zona no se guarda                           |
| P5  | D1              | Volver a guardar una obra que ya está en "vista" sin cambiar el estado no debe cambiar `vistaEn`                                               | D1 solo nombra la calificación y el comentario; falta confirmar que guardar sin cambios tampoco la cambia | `vistaEn` solo cambia cuando el estado entra o sale de "vista"; guardar sin cambiar el estado la conserva                       |
| P6  | D2 (+ H9)       | Si falta `actualizadoEn`, hoy `aMs()` pone la fecha de hoy                                                                                     | La migración de D2 le daría a una obra antigua la fecha de hoy y caería en el año actual por error        | Si falta `actualizadoEn`, no migrar la obra y contarla como "sin fecha"                                                         |
| P7  | D6              | TMDB responde 429 (demasiadas peticiones) o 404 (la obra ya no existe)                                                                         | D6 dice que la obra cuenta "sin datos", pero no si se reintenta ni si queda así para siempre              | 429: reintentar la próxima vez que se abra; 404: dejarla sin datos y no volver a pedirla                                        |
| P8  | D4              | La fecha del teléfono está en el futuro                                                                                                        | El "año actual" del selector sería un año equivocado y aparecería vacío                                   | El año actual es el del reloj del teléfono, sin corregirlo; si no tiene obras, se muestra vacío (D12)                           |
| P9  | D6              | Con `get('generos', [])` no se distingue entre "nunca se completó" y "TMDB no tiene géneros". Igual con `duracionMin: null` y `directores: []` | Una obra que de verdad no tiene esos datos se volvería a pedir a TMDB cada vez que se abre el resumen     | Considerar "completada" a la obra que ya tiene el campo `generos`, aunque esté vacío                                            |
| P10 | D2, D6          | Las reglas obligan a que toda actualización ponga `actualizadoEn = request.time`                                                               | Las migraciones cambian `actualizadoEn` aunque el usuario no haya editado nada                            | Las migraciones actualizan `actualizadoEn` como cualquier escritura, sin excepción en las reglas; el resumen usa solo `vistaEn` |
| P11 | D1              | Sin conexión, `serverTimestamp()` usa una hora estimada por el teléfono hasta que se sincroniza                                                | Si el reloj del teléfono está mal, la fecha provisional también lo está                                   | Usar la hora estimada mientras no hay red y reemplazarla por la del servidor al sincronizar                                     |
| P12 | D5, D6          | La app pide los datos a TMDB en `es-MX`. ¿"Nombres en español" quiere decir español de México?                                                 | Si se mezclan variantes del idioma, un mismo género podría contarse como dos géneros distintos            | Usar siempre `es-MX`, el idioma que ya usa la app                                                                               |
| P13 | D5 (regla 1.6)  | La regla pide `duracionMin` mayor que 0 y menor o igual que 1000. ¿Qué se guarda si TMDB trae 0 o más de 1000 minutos?                         | Guardar ese valor haría que Firestore rechace toda la escritura de la obra                                | Guardar `null`: cuenta como película sin duración (D7)                                                                          |
| P14 | D5 (regla 1.6)  | TMDB trae más de 10 géneros o más de 10 directores                                                                                             | Las reglas rechazan listas de más de 10 elementos                                                         | Guardar solo los 10 primeros                                                                                                    |
| P15 | D7              | "Un decimal": ¿se redondea o se trunca? (por ejemplo, 37,45 h). ¿Se muestra siempre con coma?                                                  | Redondear o truncar da números distintos y el test necesita una regla fija                                | Redondear a un decimal y mostrar con coma (37,5 h)                                                                              |
| P16 | D2, D3, D6      | Para saber cuáles son "las obras vistas del año elegido" hace falta `vistaEn`                                                                  | Si D6 corre antes que D2, las obras sin fecha no se completan                                             | Correr siempre D2 antes que D6                                                                                                  |
| P17 | D12, D13 (+ H1) | Hoy, sin red, la consulta a Firestore puede devolver una lista vacía sin fallar                                                                | El resumen mostraría "año vacío" (D12) cuando en realidad no hay conexión                                 | Si la lista viene de la caché de Firestore (`fromCache`), tratarla como sin conexión (D13) y no mostrar el estado vacío         |
| P18 | D8, D9          | Al desempatar por promedio de calificación, ¿se comparan los promedios exactos o redondeados?                                                  | Dos promedios casi iguales (3,33 y 3,3) pueden empatar o no según cómo se comparen                        | Comparar los promedios exactos                                                                                                  |
