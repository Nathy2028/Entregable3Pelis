# Capturas de evidencia

Copia esta carpeta en `docs/capturas/` del repositorio.

| # | Archivo | Hito / paso | Qué demuestra |
|---|---|---|---|
| 01 | 01-h1-p3-context-agents-cargado.png | H1 · Paso 3 | `/context` carga AGENTS.md y CLAUDE.md (y ya no el CLAUDE.md del examen) |
| 02 | 02-h1-p4-hooks-prettier.png | H1 · Paso 4 | `/hooks` muestra el hook PostToolUse de Prettier del proyecto |
| 03 | 03-h1-p4-commit-con-skill-formato.jpg | H1 · Paso 4 | Un commit hecho con `/commit` sigue el formato (prefijo, español, ≤ 72) |
| 04 | 04-h1-p5-vitest-primer-sensor-verde.jpg | H1 · Paso 5 | Vitest instalado y el test de la regla RF6 en verde (8 tests) |
| 05 | 05-h1-git-log-cierre-hito1.jpg | Cierre H1 | Historial: p3-final y los docs: antes del código |
| 06 | 06-h2-p10-test-colores-lista-p3.jpg | H2 · Paso 10 | El test de colores fijos lista los colores del Proyecto 3 (34 en 5 archivos) |
| 07 | 07-h2-p10-test-colores-resumen-rojo.jpg | H2 · Paso 10 | Resumen: falla solo el test de colores (rojo esperado) |
| 08 | 08-h2-p10-sensor-detecta-color-fff.jpg | H2 · Paso 10 / demo | El sensor detecta un `#FFF` agregado a propósito y se revierte sin commit |
| 09 | 09-h3-p12-tests-dominio-en-rojo.jpg | H3 · Paso 12 | Tests primero: 57 en rojo (56 del dominio + colores), 8 en verde |
| 10 | 10-h3-p12-fallan-por-no-implementado.jpg | H3 · Paso 12 | Los tests fallan por la razón correcta: "no implementado" |
| 11 | 11-h3-p13-dominio-64-en-verde.jpg | H3 · Paso 13 | Dominio implementado: 64 en verde, solo colores en rojo |
| 12 | 12-h3-p14-reglas-duracionmin-menos5-denegada.png | H3 · Paso 14 | Firestore rechaza `duracionMin: -5` (simulador) |
| 13 | 13-h3-p14-reglas-duracionmin-120-permitida.jpg | H3 · Paso 14 | Con `duracionMin: 120` la escritura se permite |
| 14 | 14-h3-p14-reglas-otra-cuenta-denegada.jpg | H3 · Paso 14 | Otra cuenta no puede leer la lista (aislamiento) |
| 15 | 15-h3-p14-reglas-duena-permitida.jpg | H3 · Paso 14 | La dueña sí puede leer su lista |
| 16 | 16-h3-p14-reglas-sin-sesion-denegada.jpg | H3 · Paso 14 | Sin sesión, la lectura se deniega |
| 17 | 17-firestore-documento-antes-de-la-epica.jpg | H3 · referencia | Documento de mi_lista sin los campos nuevos (para comparar después de T-05) |
| 18 | 18-h3-p14-t05-pelicula-con-datos-tmdb.png | H3 · Paso 14 · T-05 | Película agregada (Interestelar): `generos` en español con "Ciencia ficción", `duracionMin: 169` y `directores: ["Christopher Nolan"]` (CA-A.2.4, CA-A.2.8) |
| 19 | 19-h3-p14-t05-serie-con-datos-tmdb.png | H3 · Paso 14 · T-05 | Serie agregada (Breaking Bad): `generos` con datos, `duracionMin: null` y `directores` vacía (CA-A.2.5) |
| 20 | 20-h3-p14-t06-a11-vista-pone-vistaen.png | H3 · Paso 14 · T-06 | Por ver → Vista: aparece `vistaEn` con la misma hora que `actualizadoEn` (CA-A.1.1) |
| 21 | 21-h3-p14-t06-a12-viendo-quita-vistaen.png | H3 · Paso 14 · T-06 | Vista → Viendo: `vistaEn` pasa a `null` (CA-A.1.2) |
| 22 | 22-h3-p14-t06-a13-vista-otra-vez-nueva-fecha.png | H3 · Paso 14 · T-06 | Viendo → Vista: `vistaEn` con una hora nueva (CA-A.1.3). Documento con los 4 campos nuevos |
| 23 | 23-h3-p14-t06-a14-comentario-mantiene-vistaen.png | H3 · Paso 14 · T-06 | Vista → Vista con otro comentario: cambia `actualizadoEn`, `vistaEn` se mantiene (CA-A.1.4) |
| 24 | 24-h3-p14-t07a-h1-sin-conexion-muestra-copia.png | H3 · Paso 14 · T-07a | Modo avión: Mi lista muestra la copia guardada (5 títulos) y el aviso de sin conexión, no la lista vacía (H1, P17) |

Nota: en las capturas 12 y 13 el editor muestra "unpublished changes" porque las dos
comprobaciones de `request.time` se desactivaron solo en el simulador; no se publicaron.

Pendientes para la entrega final: resumen con datos, resumen vacío y la salida de npm test
en verde (T-11). El documento de mi_lista con los 4 campos nuevos ya está en las capturas 22 y 23.
