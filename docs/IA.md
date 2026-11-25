# Uso de IA — Mi año en cine

En este proyecto la IA programó y yo dirigí. Usé dos herramientas:

- **Claude Code** (en VS Code), como agente que leyó el repositorio, propuso planes y escribió los documentos y el código. Casi todo lo hizo en plan mode, y yo aprobé cada plan y cada edición antes del commit.
- **Claude** (en el chat), como apoyo para revisar los planes del agente antes de aprobarlos, preparar los prompts de cada paso, armar el brand board y ordenar la evidencia.

Abajo están los 5 momentos que más me enseñaron sobre trabajar con un agente: qué le pedí, qué hizo, qué tuve que corregir y qué parte del harness lo habría evitado (o lo evitó).

## Momento 1 · Un CLAUDE.md viejo dirigía al agente sin que yo lo supiera

**Qué pedí.** En el Paso 2, que propusiera el contenido de `docs/AUDITORIA.md`.

**Qué hizo el agente.** El plan incluía crear un archivo `BITACORA_IA.md` en la raíz "porque lo exige CLAUDE.md, sección 9". Mi repositorio no tenía ese archivo ni esa sección.

**Qué corregí.** Le pedí la ruta de ese CLAUDE.md. Era un archivo de un examen anterior (caza de errores de 80 minutos) guardado en `Downloads`, una carpeta por encima del proyecto. Claude Code lo cargaba en todas las sesiones, con reglas como "cambio mínimo, no refactorices, no agregues librerías", que chocaban con lo que pedía esta épica. Le cambié el nombre, reinicié Claude Code y revisé con `/context` que solo quedaran mi `AGENTS.md` y mi `CLAUDE.md`. Las reglas útiles de ese archivo (explorar antes de editar, explicar en palabras simples, decir qué probar en el teléfono) las pasé a `AGENTS.md`.

**Qué parte del harness lo habría evitado.** Tener desde el principio un `CLAUDE.md` de una sola línea (`@AGENTS.md`) y revisar `/context` al abrir cada sesión. Ahora es lo primero que hago.

## Momento 2 · El agente escribió en AGENTS.md tipos que no existen

**Qué pedí.** En el Paso 3, reescribir `AGENTS.md` con las capas y carpetas del proyecto.

**Qué hizo el agente.** En la tabla de `src/types/` puso los tipos `EstadoVisto` y `TipoMedio`. Esos nombres venían del CLAUDE.md del examen, que todavía tenía en el contexto de esa sesión. En mi código se llaman `EstadoVisionado` y `TipoObra`.

**Qué corregí.** Antes de aprobar le di los nombres reales de `src/types/index.ts`. También le pedí aclarar que, mientras no existiera `src/tema/`, los colores vivían en `src/theme.ts`.

**Qué parte del harness lo habría evitado.** La regla de `AGENTS.md` "primero explora y propón; no edites sin que yo apruebe el plan", junto con aprobar las ediciones a mano. Ningún test revisa un documento, así que en los archivos de instrucciones el sensor es la revisión humana. Si hubiera aprobado en modo automático, el error habría quedado en el archivo que guía al agente en todas las sesiones siguientes.

## Momento 3 · A los tests del dominio les faltaba un caso de la regla D8

**Qué pedí.** En el Paso 12, escribir los tests de `resumenAnual` a partir de la spec, con todos los casos límite de D3 a D11, antes de implementar.

**Qué hizo el agente.** Propuso 54 tests, con todos los desempates. Pero ninguno probaba que **una obra con varios géneros sume 1 a cada uno** (D8) ni que **una película con dos directores sume a los dos** (D9). Una implementación que contara solo el primer género habría pasado todos los tests.

**Qué corregí.** Antes de aprobar le pedí dos tests más: `CA-A.2.13 una obra con dos géneros suma 1 a cada uno` y `CA-A.2.19 una película con dos directores suma 1 a cada uno`. Quedaron 56, y se commitearon en rojo antes del `feat:` del dominio.

**Qué parte del harness lo habría evitado.** Los tests primero (commit `test:` en rojo) y la tabla criterio → test de la spec. Gracias a eso el hueco se vio en el plan y no después. Aprendí a leer cada frase de la decisión del cliente y buscar un test que la pruebe: si una frase no tiene test, falta un caso.

## Momento 4 · "40 h" o "40,0 h": el agente iba a decidir algo que era mío

**Qué pedí.** En el Paso 13, implementar el dominio hasta que pasaran los tests.

**Qué hizo el agente.** En el plan avisó de una "decisión menor": un número entero de horas se escribiría sin decimal ("40 h"), porque ni la spec ni los tests lo fijaban.

**Qué corregí.** D7 dice "en horas con un decimal (37,5 h)", así que pedí que siempre se mostrara un decimal ("40,0 h") y que la función tuviera un comentario citando D7.

**Qué parte del harness lo habría evitado.** Un caso de test con un número entero en `formatearHoras` desde el Paso 12. Lo bueno es que la regla de `AGENTS.md` de explicar las decisiones hizo que el agente lo mostrara en el plan en vez de decidirlo en silencio.

## Momento 5 · La skill /commit chocaba con los "tests en rojo" que pedía el enunciado

**Qué pedí.** En el Paso 4, una skill `/commit` que no hiciera commit si fallaban `npm test` o `tsc`.

**Qué hizo el agente.** La hizo bien, pero eso chocaba con dos cosas del enunciado: el test de colores fijos **debe fallar** desde el Hito 2 hasta el Hito 4, y el Paso 12 pide un commit `test:` **con los tests en rojo**. Con la skill tal como estaba no habría podido hacer ningún commit de código en todo el Hito 3. El agente lo detectó al escribir el backlog.

**Qué corregí.** Antes de crear el test de colores escribí en `AGENTS.md` una sección "Tests en rojo esperados" con solo dos casos permitidos (el test de colores hasta T-11, con la lista exacta de archivos, y el `test:` del Paso 12), y la skill pasó a aceptar solo esos casos, con mi confirmación y dejándolo escrito en el cuerpo del commit. Ningún sensor se desactivó: cuando probé a propósito un `#FFF` en `PerfilScreen.tsx`, la skill lo habría bloqueado porque ese archivo no estaba en la lista.

**Qué parte del harness lo habría evitado.** Pensar las excepciones en `AGENTS.md` antes de crear el primer sensor que falla a propósito. Primero el documento y después la skill.

## Otro uso que dejo registrado

La prueba CA-A.1.7 (Firestore rechaza `vistaEn` si la obra no está vista) la ejecutó Claude en mi navegador, en el simulador de reglas de Firebase, sin modificar ni publicar las reglas. Yo revisé el resultado en las capturas 49 y 50 y lo anoté en `docs/VERIFICACION.md`.
