Descripción del proyecto
1.1 Contexto y objetivo
En el Proyecto 3 construyeron una app desde cero. En el trabajo real casi nunca pasa eso: lo habitual es recibir una app que ya existe y hacerla crecer sin romperla. Este proyecto practica exactamente eso, con un agente de IA como programador y el estudiante como responsable de especificar, revisar y verificar.

Objetivo: agregar a Mi Cartelera la épica Mi año en cine siguiendo el proceso de clase, de modo que cada línea de código nueva tenga detrás una auditoría, un harness, un sistema de diseño, una spec y una verificación.

1.2 Qué se evalúa (resultados de aprendizaje)
Auditoría de un proyecto existente: comparar el código con su especificación y decidir qué se corrige.
Harness engineering: instrucciones (AGENTS.md), skills, hooks y sensores que guían y comprueban al agente.
Spec-driven development: PRD → épica → historias → criterios → tickets → spec → código, en ese orden y visible en el historial de git.
Sistema de diseño: un brand board propio que alimenta un DESIGN.md y los tokens del código.
Verificación: tests automáticos para la lógica y prueba humana en el teléfono para la experiencia.
1.3 La épica: Mi año en cine
Una pantalla nueva, accesible desde una pestaña, donde el usuario ve el resumen de lo que vio en un año:

obras vistas en el año, con cuántas son películas y cuántas series;
horas de cine (películas);
género más visto y director más visto;
mes más activo, con una barra por mes;
obra destacada: la mejor calificada del año;
selector de año.
Para que el resumen sea posible, la app empieza a guardar cuándo se vio cada obra y algunos datos de TMDB que hoy no guarda (géneros, duración y director).

1.4 Historias de usuario de partida
Estas son las historias de la épica, escritas en una línea. En el Hito 2 cada estudiante las refina con criterios DADO / CUANDO / ENTONCES que cubran las decisiones de 1.5.

Id

Historia

Idea central del criterio

HU-A.1

Como usuario, quiero que la app recuerde cuándo vi cada obra

Marcar como vista guarda la fecha; dejar de estar vista la borra

HU-A.2

Como usuario, quiero ver mi resumen del año

Totales, horas, género, director, mes más activo y obra destacada

HU-A.3

Como usuario, quiero cambiar de año

El selector muestra solo años con obras vistas, más el actual

HU-A.4

Como usuario, quiero ver mi resumen aunque mis obras sean anteriores a esta épica

Las obras ya vistas reciben fecha y datos de TMDB sin perder nada

HU-A.5

Como usuario, quiero entender un resumen vacío o incompleto

Estados de carga, vacío, error, sin conexión y datos faltantes, cada uno con su mensaje

1.5 Decisiones del cliente
El cliente (el docente) ya tomó estas decisiones. Son reglas de negocio: deben aparecer en el PRD, convertirse en criterios y tener tests. Si encuentran un caso que estas reglas no cubren, lo anotan en el PRD como punto abierto y lo consultan.

#

Tema

Decisión

D1

Fecha de visionado

Nuevo campo vistaEn. Se guarda con serverTimestamp cuando la obra pasa a vista. Si deja de estar vista, vuelve a null; si vuelve a vista, toma la fecha nueva. Editar calificación o comentario no la cambia

D2

Obras vistas antes de esta épica

Al abrir Mi año en cine, las obras en vista sin vistaEn reciben vistaEn = actualizadoEn. Se hace una sola vez y se guarda en Firestore

D3

A qué año pertenece una obra

Al año calendario de vistaEn en la hora local del teléfono. Cada obra cuenta una sola vez: no hay revisionados

D4

Años del selector

Los años con al menos una obra vista, más el año actual, del más reciente al más antiguo. Se abre en el año actual

D5

Datos de TMDB

Al agregar una obra se guardan generos (nombres en español), duracionMin (solo películas; en series es null) y directores (solo películas; en series es una lista vacía)

D6

Obras guardadas sin esos datos

Al abrir el resumen se completan desde TMDB las obras vistas del año elegido que no los tengan, de una en una y con progreso visible. Si TMDB falla para una obra, cuenta en el total pero no en horas, género ni director, y el resumen dice cuántas quedaron sin datos

D7

Horas de cine

Suma de duracionMin de las películas vistas, en horas con un decimal (37,5 h). Las series cuentan como obras, no en horas. Una película sin duración no suma y el resumen lo indica

D8

Género más visto

Cada obra suma 1 a cada uno de sus géneros. Gana el que tenga más obras. Empate: mayor promedio de calificación personal entre sus obras calificadas (sin calificadas pierde). Si persiste: orden alfabético

D9

Director más visto

Solo películas; cada director suma 1. Mismo desempate que D8. Si ninguna película tiene director, la tarjeta dice que no hay datos suficientes

D10

Mes más activo

El mes con más obras vistas. Empate: el más reciente. Se muestran los 12 meses del año, también los que tienen 0

D11

Obra destacada

La de mayor calificación personal. Empate: la de vistaEn más reciente. Si no hay obras calificadas, la tarjeta invita a calificar

D12

Resumen vacío

Un año sin obras vistas muestra un estado vacío con el botón Ir a Mi lista

D13

Sin conexión

El resumen se calcula con la copia de AsyncStorage y muestra un aviso. Sin conexión no se completan datos ni se migran fechas

Ninguna de estas reglas debe vivir en una pantalla. Todas se calculan en funciones de dominio puras, probadas con Vitest (ver 1.7).

1.6 Cambios al modelo de datos
La ruta no cambia: usuarios/{uid}/mi_lista/{itemId}. Se agregan cuatro campos a cada documento:

Campo

Tipo

Descripción

vistaEn

marca de tiempo o nulo

Cuándo pasó a vista (D1 y D2)

generos

lista de texto

Nombres de género de TMDB en español, máximo 10

duracionMin

número o nulo

Duración en minutos; null en series o si TMDB no la trae

directores

lista de texto

Directores de la película, máximo 10; vacía en series

Las reglas de Firestore deben validar estos campos sin romper los documentos que todavía no los tienen. Por eso se leen con get(campo, valorPorDefecto). Esta es la parte nueva de esItemValido; cada estudiante la integra con sus reglas del Proyecto 3:

// vistaEn: solo si la obra está vista
&& (d.get('vistaEn', null) == null || (d.estado == 'vista' && d.vistaEn is timestamp))
&& (d.get('generos', []) is list && d.get('generos', []).size() <= 10)
&& (d.get('duracionMin', null) == null
    || (d.duracionMin is int && d.duracionMin > 0 && d.duracionMin <= 1000))
&& (d.get('directores', []) is list && d.get('directores', []).size() <= 10)
En TypeScript, ItemLista suma los campos nuevos y la lógica del resumen vive en un archivo de dominio sin Firebase ni fechas del sistema:

// src/dominio/resumenAnual.ts (firma sugerida)
export interface ResumenAnual {
  anio: number
  totalObras: number
  peliculas: number
  series: number
  horas: number                 // con un decimal (D7)
  peliculasSinDuracion: number
  obrasSinDatos: number         // D6
  generoTop: { nombre: string; obras: number } | null
  directorTop: { nombre: string; obras: number } | null
  obrasPorMes: number[]         // 12 posiciones, enero = 0 (D10)
  mesTop: number | null
  destacada: ItemLista | null   // D11
}

export function aniosDisponibles(items: ItemLista[], anioActual: number): number[]
export function resumenAnual(items: ItemLista[], anio: number): ResumenAnual
El año actual se recibe como parámetro y nunca se lee con new Date() dentro del dominio: así los tests no dependen del día en que se ejecutan.

1.7 Harness mínimo obligatorio
El harness es lo que hace que el agente trabaje igual en cada sesión nueva, sin depender de lo que se le explicó antes. Las guías le dicen qué hacer; los sensores comprueban que lo hizo.

Pieza

Tipo

Qué debe tener

AGENTS.md

Guía

Qué es la app, capas y carpetas, comandos de verificación, reglas (nunca leer .env, pantallas sin Firebase, sin any) y la línea que obliga a leer DESIGN.md antes de tocar pantallas o componentes

CLAUDE.md

Guía

Una sola línea: @AGENTS.md

DESIGN.md

Guía

El sistema de diseño (1.8). Se referencia desde AGENTS.md, no se importa en CLAUDE.md

Skill /commit

Guía

Commits en español con prefijo (docs:, feat:, fix:, test:, chore:)

Hook de formato

Sensor

Prettier sobre cada archivo que el agente edita

Tests del dominio

Sensor

Vitest sobre resumenAnual y aniosDisponibles, con un test por cada decisión D1 a D13 que sea lógica

Test de una regla del Proyecto 3

Sensor

Por ejemplo, "solo se califica si el estado es vista" o la validación de transiciones

Test de colores fijos

Sensor

Falla si un archivo fuera de src/tema/ escribe un color en hexadecimal

npm test y npx tsc --noEmit

Sensor

Los dos deben pasar antes de cada commit de código

1.8 Sistema de diseño y brand board
En el taller recibieron un DESIGN.md prefabricado. Aquí cada estudiante crea el suyo, en una cadena donde cada pieza alimenta a la siguiente:

Brief de marca (docs/diseno/BRIEF.md): para quién es la app, tres adjetivos de personalidad, qué debe sentir el usuario al ver su resumen del año y qué de la app actual se conserva.
Brand board (docs/diseno/brand-board.html): una sola página HTML que se abre en el navegador y muestra las decisiones visuales. Es para personas: se mira, se compara y se ajusta antes de escribir nada para el agente.
DESIGN.md (en la raíz): las mismas decisiones escritas para el agente, con tokens, componentes y reglas.
src/tema/: los valores en código. Es la única fuente de verdad de colores, espacios y tamaños.
El brand board debe incluir como mínimo:

Sección

Contenido

Marca

Nombre y logotipo o wordmark de la app; el logo de TMDB siempre menos prominente

Color

Paleta con nombre de token, valor y uso; colores de estado (por ver, viendo, vista) y de error; contraste de cada texto sobre su fondo (mínimo 4,5:1)

Tipografía

Escala de tamaños con uso (título, cuerpo, dato numérico…). Fuente del sistema por defecto

Espacio y forma

Escala de espacios, radios y alto mínimo táctil de 44

Componentes

Los del Proyecto 3 que se conservan (tarjeta de obra, selector de estado, estrellas, botón) y los nuevos de la épica: tarjeta de dato, barras por mes, tarjeta de obra destacada, selector de año y estados de pantalla

Pantalla de ejemplo

Una maqueta de Mi año en cine en tamaño de teléfono, armada solo con los componentes del board

Voz

Tono de los textos y ejemplos de mensajes de vacío y error

DESIGN.md sigue la estructura vista en el taller: principios, tokens, componentes, pantallas, voz, accesibilidad, una tabla de Sí y no y decisiones pendientes. Pueden usar la IA para generar el brand board a partir del brief, pero las decisiones son del estudiante: el agente no modifica DESIGN.md por su cuenta.

1.9 Estructura del repositorio
Se conserva la estructura del Proyecto 3 y se agrega:

AGENTS.md  CLAUDE.md  DESIGN.md
.claude/
  skills/commit/      hooks/
docs/
  AUDITORIA.md        (inicial y final)
  prd/                (PRD con las decisiones del cliente)
  backlog/            (épica, historias, criterios, tickets)
  specs/              (spec de la épica)
  diseno/             (BRIEF.md y brand-board.html)
  VERIFICACION.md
  IA.md
src/
  dominio/            (resumenAnual.ts y sus tests)
  tema/               (tokens y test de colores fijos)
1.10 Restricciones y buenas prácticas
Siguen vigentes todas las del Proyecto 3 (.env fuera del repositorio, capa services/, sin any injustificados, tres estados por petición, 44 px, atribución de TMDB). Se suman:

Ningún código sin su spec: en el historial, los commits docs: de cada cambio van antes que los de código.
Ninguna pantalla sin DESIGN.md: colores y tamaños salen de src/tema/.
Ningún sensor desactivado: no se borra ni se salta un test para que pase.
Dependencias nuevas solo si la spec las justifica, instaladas con npx expo install y compatibles con Expo Go. No se usan librerías de gráficas: las barras por mes se construyen con View.
La configuración de Firebase y el token de TMDB nunca van al chat del agente.
1.11 Uso de IA
En este proyecto la IA programa y el estudiante dirige. Las reglas son tres:

Cada paso parte de un documento (auditoría, PRD, spec, DESIGN.md), no de una idea suelta en el chat.
Todo cambio del agente se revisa antes del commit; en la demo se les pedirá explicar cualquier parte.
docs/IA.md registra 5 momentos clave: qué se pidió, qué hizo el agente, qué se corrigió y qué parte del harness lo habría evitado.
Parte 2 · Guía paso a paso de lo que deben entregar
El proyecto tiene 4 hitos, uno por sesión. Cada paso tiene un entregable y una forma de comprobarlo. No avancen al siguiente hito sin cumplir las verificaciones del anterior: el orden es parte de lo que se evalúa.

Hito 1 — Auditoría y harness
Paso

Qué hacer

Entregable y cómo verificar

0. Punto de partida

En el repositorio del Proyecto 3, marcar el último commit con la etiqueta p3-final y trabajar en una rama nueva epica-mi-anio.

git tag muestra p3-final y git branch la rama nueva.

1. Presentar el repo al agente

Con Claude Code en plan mode, pedirle que lea el proyecto y resuma qué hace la app, sus capas y cómo se verifica.

Un resumen que el estudiante revisa y corrige si el agente se equivocó.

2. Auditoría inicial

En plan mode, auditar el código contra SPEC.md y los RF1 a RF10 del Proyecto 3. Escribir docs/AUDITORIA.md con una tabla: id, hallazgo, evidencia (archivo y función), gravedad y decisión (corregir ahora, riesgo conocido o fuera de alcance).

Cada hallazgo tiene evidencia y decisión. Los de gravedad alta se corrigen con la regla de siempre: primero el documento, después el código.

3. Instrucciones

Crear AGENTS.md y CLAUDE.md según 1.7.

Al abrir una sesión nueva, /context muestra AGENTS.md cargado.

4. Skill y hook

Agregar la skill /commit y el hook de Prettier. Pueden tomar como referencia los del repositorio del taller.

/hooks muestra el hook; un commit hecho con /commit sigue el formato.

5. Primer sensor

Instalar Vitest y escribir el test de una regla que ya existe en el Proyecto 3.

npm test pasa. Si el test descubre un fallo, se anota en la auditoría.

Entregable del Hito 1: docs/AUDITORIA.md + harness funcionando (AGENTS.md, CLAUDE.md, skill, hook y un test en verde).

Hito 2 — Del PRD al sistema de diseño
Paso

Qué hacer

Entregable y cómo verificar

6. PRD

Crear o actualizar docs/prd/ con la épica Mi año en cine, las decisiones D1 a D13 en "Reglas de negocio" y una sección de puntos abiertos.

Cada decisión de 1.5 aparece en el PRD con su número.

7. Backlog

En docs/backlog/, la épica con las historias HU-A.1 a HU-A.5 refinadas: criterios DADO / CUANDO / ENTONCES (al menos uno por decisión) y tickets con Definition of Done.

Cada criterio se puede comprobar con un test o con una acción concreta en el teléfono.

8. Brief de marca

Escribir docs/diseno/BRIEF.md (ver 1.8).

El brief cabe en una página y responde para quién es, cómo se siente y qué se conserva.

9. Brand board

Crear docs/diseno/brand-board.html a partir del brief, con las secciones de 1.8. Revisarlo y ajustarlo hasta estar conforme con cada decisión.

Se abre en el navegador; los contrastes de texto cumplen 4,5:1; la pantalla de ejemplo usa solo componentes del board.

10. DESIGN.md y su sensor

Escribir DESIGN.md con las decisiones del brand board, agregar en AGENTS.md la línea que obliga a leerlo y crear el test de colores fijos.

El test falla y lista los colores de las pantallas del Proyecto 3. Es lo esperado: esa lista es trabajo del Hito 4.

Entregable del Hito 2: PRD, backlog, brief, brand board y DESIGN.md, sin código nuevo de la épica.

Hito 3 — Spec, dominio y datos
Paso

Qué hacer

Entregable y cómo verificar

11. Spec de la épica

Escribir docs/specs/01-mi-anio-en-cine.md: alcance, fuera de alcance, cambios al modelo, funciones de dominio, servicios, reglas de Firestore, componentes elegidos (citando DESIGN.md sin copiar valores), tickets y una tabla criterio → verificación.

Ningún criterio del backlog queda sin verificación asignada.

12. Tests primero

En plan mode, pedir al agente los tests de resumenAnual y aniosDisponibles a partir de la spec, incluidos los casos límite de D3 a D11. Guardarlos antes de implementar.

Commit test: con los tests en rojo.

13. Dominio

Implementar las funciones de dominio hasta que los tests pasen.

npm test y npx tsc --noEmit en verde.

14. Datos y reglas

Guardar los datos de TMDB al agregar (D5), registrar vistaEn (D1), hacer las migraciones de D2 y D6 y publicar las reglas de 1.6. Probar con dos cuentas que siguen aisladas.

Documentos con los campos nuevos en la consola de Firebase; una escritura con duracionMin: -5 es rechazada.

15. Tokens

Crear src/tema/ con los tokens de DESIGN.md.

Los valores coinciden con el brand board.

Entregable del Hito 3: spec, dominio probado, modelo de datos y reglas publicadas.

Hito 4 — Interfaz, verificación y demo
Paso

Qué hacer

Entregable y cómo verificar

16. Interfaz

En plan mode, pedir un plan por tickets y aprobarlo; luego implementar la pantalla Mi año en cine y sus componentes, y pasar las pantallas del Proyecto 3 a los tokens.

El test de colores fijos pasa; estados de carga, vacío, error y sin conexión visibles.

17. Verificación humana

Escribir docs/VERIFICACION.md (criterio, pasos, resultado esperado, resultado obtenido) y llenar a mano la última columna probando en el teléfono.

Todos los criterios tienen resultado obtenido; lo que falló se corrigió o quedó anotado.

18. Auditoría final

Actualizar docs/AUDITORIA.md: qué se resolvió, qué riesgos quedan y qué hallazgos nuevos aparecieron.

La auditoría tiene una sección de cierre con fecha.

19. Documentación

README actualizado (qué cambió, cómo correr los tests) y docs/IA.md (ver 1.11).

Una persona nueva puede instalar y correr los tests siguiendo el README.

20. Demo

Preparar la demo de 5 minutos con el guion de más abajo.

Demo ensayada en Expo Go.

Entregable del Hito 4: épica funcionando, verificada y documentada.

Entregables finales
Entregable

Formato

Contenido mínimo

Repositorio de GitHub

Enlace a la rama epica-mi-anio (o a main ya fusionada)

Harness, DESIGN.md, docs/ completo, código y tests; sin .env ni claves

Historial de git

El propio repositorio

Commits docs: antes que los de código en cada cambio; commit test: antes de feat: en el dominio

Brand board

docs/diseno/brand-board.html

Secciones de 1.8

Capturas

Imágenes en docs/

Resumen con datos, resumen vacío, salida de npm test en verde y un documento de mi_lista con los campos nuevos

Demo

5 minutos en vivo, el 26 de noviembre en clase

Según el guion

Guion de la demo (5 minutos)
Mostrar el brand board y explicar una decisión de diseño (45 s).
Recorrer el git log y señalar dónde la spec fue antes que el código (45 s).
Marcar una obra como vista y mostrar cómo cambia el resumen (1 min).
Cambiar de año hasta uno vacío (30 s).
Romper a propósito una regla (un color fijo en una pantalla o un desempate) y mostrar el sensor que lo detecta (1 min).
Explicar una decisión del cliente: dónde está en el PRD, en el criterio, en el test y en el código (1 min).
Antes de entregar (lista de verificación)
docs/AUDITORIA.md tiene la auditoría inicial y la de cierre.
AGENTS.md, CLAUDE.md, la skill /commit y el hook están en el repositorio.
Las decisiones D1 a D13 están en el PRD, en criterios y, si son lógica, en tests.
El brand board, DESIGN.md y src/tema/ coinciden.
npm test y npx tsc --noEmit pasan, incluido el test de colores fijos.
Las reglas de Firestore están publicadas y la copia está en el repositorio.
docs/VERIFICACION.md está lleno a mano.
No hay claves ni .env en el repositorio ni en el historial.
La atribución de TMDB sigue visible.
La demo se ensayó dentro del tiempo.