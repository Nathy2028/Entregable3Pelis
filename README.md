# Cinta · Mi Cartelera Personal

App móvil (React Native + Expo, TypeScript) donde cada usuario busca películas y series en TMDB, las agrega a su lista personal y las organiza por estado (por ver, viendo, vista) con calificación y comentario propios. La lista es privada: se guarda en Firestore bajo el uid de cada usuario.

## Mi año en cine (Proyecto 4)

La épica agrega la pestaña **Mi año** con el resumen de lo que viste en un año: obras vistas (películas y series), horas de cine, mes con más obras, género y director más vistos, obras por mes y la obra mejor calificada. Un selector cambia de año.

Para calcularlo, cada obra de `mi_lista` guarda ahora `vistaEn` (cuándo pasó a "vista") y `generos`, `duracionMin` y `directores`, que se piden a TMDB al agregarla.

Al abrir la pestaña, las obras vistas antes de la épica reciben su fecha, y las del año elegido, sus datos de TMDB. Sin conexión se muestra la última copia con un aviso.

## Objetivo

Integrar en una sola app autenticación con Firebase Auth, datos propios en Firestore y una API externa pública (TMDB), con navegación, estado global, caché sin conexión y reglas de seguridad.

## Pantallas

| Pantalla           | Contenido                                                                                                                            | Navegación      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| Login / Registro   | Registro con nombre, apellido, usuario único, correo, contraseña y confirmación; errores por campo                                   | Solo sin sesión |
| Buscar             | Búsqueda por título (películas y series), carátula, año y nota de TMDB; carga, error y sin resultados; paginación al hacer scroll    | Pestaña         |
| Detalle            | Póster, sinopsis, calificación TMDB, elenco, tráiler, compartir y "Agregar a mi lista"                                               | Pila            |
| Mi lista           | Filtros por estado (Por ver / Viendo / Vista) y tipo (Películas / Series); aviso sin conexión                                        | Pestaña         |
| Mi año en cine     | Resumen del año elegido (tarjetas, barras por mes y obra destacada), selector de año y estados de carga, vacío, sin conexión y error | Pestaña         |
| Editar mi entrada  | Estado, calificación 1–5 (solo si está "Vista"), comentario hasta 500 caracteres y quitar con confirmación                           | Pila            |
| Perfil (Acerca de) | Foto, nombre, @usuario, accesos a cuenta y preferencias, atribución y logo de TMDB, cerrar sesión                                    | Pestaña         |
| Editar perfil      | Foto (cámara o galería), nombre, apellido y nombre de usuario                                                                        | Pila            |
| Seguridad          | Verificación del correo, cambio de correo y de contraseña (piden la contraseña actual)                                               | Pila            |
| Accesibilidad      | Tamaño de texto, alto contraste y reducir movimiento; se aplican a toda la app                                                       | Pila            |
| Créditos           | Atribución de TMDB, créditos de imágenes, versión y cerrar sesión                                                                    | Pila            |

## Instalación

Requisitos: Node 22.13 o superior y la app **Expo Go** para SDK 57 en el teléfono (el proyecto usa Expo SDK 57).

```bash
npm install
cp .env.example .env   # y completar los valores
npm run dev            # escanear el QR con Expo Go
```

### Variables de entorno (`.env`)

| Variable                                                        | De dónde sale                                                                                   |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_TMDB_TOKEN`                                        | TMDB → Ajustes → API → _API Read Access Token_ (el token largo `eyJ…`, **no** la API Key corta) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` y demás `EXPO_PUBLIC_FIREBASE_*` | Firebase → Configuración del proyecto → Tus apps → app web                                      |

`.env` está en `.gitignore`. Las variables `EXPO_PUBLIC_*` quedan dentro del paquete de la app: para este proyecto no comercial es aceptable, pero cualquiera que descomprima la app podría leer el token de TMDB. La solución completa es un proxy en un servidor propio.

### APK para Android (EAS Build)

El proyecto está enlazado a EAS (`@w4730/mi-cartelera`) y [eas.json](eas.json) tiene el perfil `preview`, que genera un APK instalable.

```bash
npx eas-cli@latest build -p android --profile preview
```

Como `.env` no se sube, las variables `EXPO_PUBLIC_*` están cargadas en el entorno **preview** de EAS. Si cambia alguna:

```bash
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_TMDB_TOKEN --value "<nuevo>" --visibility sensitive
```

La clave de firma (keystore) la guarda EAS; no hace falta Android Studio ni Java.

Nota: este enlace es de la cuenta de Expo del Proyecto 3 en grupo (hallazgo H2 de docs/AUDITORIA.md). Para la entrega individual la demo se hace en Expo Go; no se generó un APK propio.

### Firebase

1. Authentication → habilitar **Correo/contraseña**.
2. Firestore → crear la base de datos.
3. Copiar el contenido de [firestore.rules](firestore.rules) en Firestore → Reglas y publicar.

## Cómo correr los tests

Los tests no necesitan `.env`, Firebase ni el teléfono. Desde la carpeta del proyecto:

```bash
npm install         # solo la primera vez
npm test            # Vitest: 7 archivos, 85 tests
npm run typecheck   # chequeo de tipos (tsc --noEmit)
npx expo lint       # lint
```

`npm test` prueba:

- **Dominio** (`src/dominio/*.test.ts`): reglas de la lista (`reglasLista`), resumen del año y horas con coma (`resumenAnual`), migraciones de obras anteriores a la épica (`migraciones`) y datos de TMDB que se guardan al agregar una obra (`datosTmdb`).
- **Textos** (`src/dominio/textosResumen.test.ts`): las frases de "Mi año en cine": resumen, avisos y progreso (en plural y singular), mes top, fecha de la obra destacada y la etiqueta de las barras para TalkBack.
- **Tokens contra el brand board** (`src/tema/tokens.test.ts`): los colores, espacios, radios y tipografía de `src/tema/tokens.ts` son los de `docs/diseno/brand-board.html`.
- **Colores fijos** (`src/tema/coloresFijos.test.ts`): falla si aparece un color (`#…`, `rgb(…)`) fuera de `src/tema/`.

Si todo está bien, `npm test` termina con `Tests 85 passed (85)`, y `npm run typecheck` y `npx expo lint` terminan sin errores.

## Estructura

```
App.tsx                      Proveedores y navegación
firestore.rules              Reglas de seguridad (cada usuario solo ve su lista)
src/
  types/                     Interfaces de TMDB, ItemLista, EstadoPeticion<T>
  services/                  Único lugar que llama a Firebase, TMDB y la cámara/galería
    firebase.ts              Inicialización (sesión persistente) y tiempo máximo de escritura
    authService.ts           Login, registro, reautenticación, cambio de correo/contraseña
    perfilService.ts         Perfil y nombres de usuario únicos
    fotoService.ts           Elegir, recortar y comprimir la foto de perfil
    tmdbService.ts           buscar, obtenerDetalle, urlImagen
    listaService.ts          CRUD de usuarios/{uid}/mi_lista
    cache.ts                 Copia local genérica en AsyncStorage
  context/CarteleraContext   Usuario, perfil, lista y acciones (actualización optimista)
  context/AccesibilidadContext  Preferencias de accesibilidad y tema
  dominio/                   Reglas del negocio como funciones puras, sin Firebase ni React (con sus tests)
  tema/                      Única fuente de colores (normal y alto contraste), espacios, radios y tipografía
  utils/validacion.ts        Reglas de los formularios (las mismas que firestore.rules)
  utils/fechas.ts            Único lugar que lee el reloj del teléfono (año actual, mes y día local)
  hooks/usePeticion.ts       Estados cargando / error / éxito para cualquier petición
  hooks/useMiAnio.ts         Datos de "Mi año": resumen, años disponibles, migraciones y progreso
  navigation/                Pila + pestañas; Login condicional según la sesión
  screens/                   Una pantalla por archivo
    MiAnioScreen.tsx         Pestaña "Mi año en cine" y sus estados
  components/                ui.tsx (botones, campos, formulario, tarjetas) y obra.tsx (póster, elenco, TMDB)
    resumen.tsx              Tarjetas, barras por mes, obra destacada y progreso de "Mi año"
```

## Modelo de datos

| Ruta                               | Contenido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usuarios/{uid}`                   | Perfil: `nombre`, `apellido`, `usuario`, `foto` (JPEG ~30 KB como data URI), `creadoEn`, `actualizadoEn`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `nombresUsuario/{usuario}`         | `{ uid }`: reserva el nombre de usuario. Las reglas no permiten crear uno que ya existe, así no hay dos iguales                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `usuarios/{uid}/mi_lista/{itemId}` | `itemId = tipo_tmdbId` (por ejemplo `movie_550`), así una obra no puede guardarse dos veces. Campos: `tmdbId`, `tipo`, `titulo`, `anio`, `posterPath`, `estado`, `calificacionPersonal`, `comentario`, `agregadoEn`, `actualizadoEn`. Desde la épica también: `vistaEn` (timestamp de cuándo pasó a "vista"; solo con `estado == 'vista'`, si no `null`), `generos` (lista de hasta 10, en español), `duracionMin` (entero de 1 a 1000; `null` en series o sin dato) y `directores` (lista de hasta 10; vacía en series). Si TMDB no responde al agregar, la obra se guarda sin estos tres; si es una obra vista, se completan al abrir "Mi año" en su año |

La foto de perfil se guarda en Firestore porque Firebase Storage exige el plan Blaze (de pago).

## Seguridad

- Las reglas ([firestore.rules](firestore.rules)) aíslan los datos por `uid` y validan cada campo en el servidor: longitudes, formato del usuario, tamaño y tipo de la foto, estados válidos y calificación solo si la obra está "Vista".
- El cambio de nombre de usuario reserva el nuevo y libera el anterior en un solo lote atómico.
- Cambiar el correo o la contraseña exige volver a escribir la contraseña actual (reautenticación). El correo nuevo se confirma con un enlace (`verifyBeforeUpdateEmail`).
- Al registrarse se envía un correo de verificación; contraseña de al menos 8 caracteres con letras y números.

## Accesibilidad

Tamaño de texto (normal, grande, máximo), alto contraste y reducir movimiento, guardados en el teléfono. Todos los elementos tocables miden al menos 44 px, tienen etiquetas para TalkBack y VoiceOver, y el texto respeta el tamaño de letra del sistema. Los formularios desplazan el campo activo por encima del teclado.

## Sin conexión

Al abrir la app se muestra primero la copia de AsyncStorage y luego se pide la lista a Firestore. Las escrituras tienen un tiempo máximo de 8 s: sin red, la UI ya cambió, Firestore deja la escritura en cola y aparece el aviso "Sin conexión".

## Documentación del proyecto

- [AGENTS.md](AGENTS.md): reglas para trabajar con el agente (capas, comandos, tests en rojo esperados).
- [DESIGN.md](DESIGN.md): sistema de diseño (colores, tipografía, componentes y voz).
- [docs/AUDITORIA.md](docs/AUDITORIA.md): auditoría del Proyecto 3 y su cierre.
- [docs/prd/](docs/prd/): PRD de la épica.
- [docs/backlog/](docs/backlog/): historias de usuario y tickets de la épica.
- [docs/specs/](docs/specs/): spec de "Mi año en cine" con sus decisiones y criterios.
- [docs/diseno/](docs/diseno/): brief y brand board.
- [docs/VERIFICACION.md](docs/VERIFICACION.md): verificación humana de cada criterio, con evidencias en `docs/capturas/`.
- [docs/IA.md](docs/IA.md): cómo se usó la IA en el proyecto.

## Harness

- **`/commit`**: skill que hace el stage con rutas explícitas, corre `tsc` y `npm test` si hay código y pide confirmar el mensaje.
- **Hook de Prettier**: formatea cada archivo que edita Claude Code (`.claude/settings.json` → `.claude/hooks/prettier.js`).
- **Sensores**: los tests de Vitest, incluidos el de tokens contra el brand board y el de colores fijos.
- **Tests en rojo esperados**: los dos únicos casos en que se permite un commit con tests fallando, descritos en `AGENTS.md`.

## Atribución

This product uses the TMDB API but is not endorsed or certified by TMDB. Foto de portada: Rafi Mohammed en Unsplash.
