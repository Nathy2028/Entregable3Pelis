# AGENTS.md — Cinta · Mi Cartelera Personal

## 1. Qué es la app

**Cinta · Mi Cartelera Personal** es una app móvil para buscar películas y series y llevar una lista
personal (por ver / viendo / vista), con calificación y comentario.

- Expo SDK 57 + React Native
- TypeScript en modo estricto
- Firebase Auth + Firestore
- TMDB como API de películas y series

## 2. Capas y carpetas

| Carpeta | Contenido |
|---|---|
| `src/types/` | Tipos compartidos (`EstadoVisionado`, `TipoObra`, `Obra`, `ItemLista`, `Perfil`, `EstadoPeticion<T>`, etc.) |
| `src/services/` | Único acceso a Firebase, TMDB (`fetch`) y AsyncStorage |
| `src/context/` | Estado compartido (sesión, lista, accesibilidad) |
| `src/hooks/` | Hooks reutilizables (por ejemplo, `usePeticion`) |
| `src/navigation/` | Navegadores de pila y de pestañas |
| `src/screens/` | Pantallas |
| `src/components/` | Componentes de interfaz reutilizables |
| `src/utils/` | Utilidades generales |
| `src/dominio/` *(nueva)* | Funciones puras con las reglas del negocio: sin Firebase, sin React y sin `new Date()` (la fecha llega como parámetro) |
| `src/tema/` *(nueva)* | Única fuente de colores, espacios y tamaños. Fuera de aquí no se escriben valores fijos. `src/theme.ts` solo reexporta desde `src/tema/` y se retira en T-11. |

## 3. Navegación

- **React Navigation** (pila + pestañas), en `src/navigation/`.
- **NO usar Expo Router.** No existe `src/app/` y no se usan `Link`, `router` ni `useLocalSearchParams` de `expo-router`.

## 4. Comandos de verificación

```bash
npm test             # pruebas
npx tsc --noEmit     # chequeo de tipos
npx expo lint        # lint
```

`npm test` y `npx tsc --noEmit` deben pasar antes de cada commit de código.

## 5. Reglas

- Nunca leer, abrir ni mostrar `.env`.
- Pantallas y componentes no importan Firebase: todo pasa por `src/services/`.
- Sin `any`.
- Dependencias nuevas solo si la spec las justifica, se instalan con `npx expo install` y deben ser compatibles con Expo Go. No usar librerías de gráficas.
- No borrar, desactivar ni saltar tests para que pasen.
- No modificar `DESIGN.md` por iniciativa propia.
- Ningún código sin su documento: primero va el commit `docs:` y después el de código.
- Los commits se hacen con la skill `/commit`.

## 6. Cómo trabajar conmigo

- Primero explora y propón. No edites sin que yo apruebe el plan.
- Explícame las causas y las decisiones en palabras simples.
- Después de cada cambio, dime qué prueba concreta hago en el teléfono, en la consola o en Firebase para verificarlo.
- Ejecuta `npx tsc --noEmit` antes de decir que algo está terminado.

## 7. Diseño

Antes de crear o modificar cualquier archivo en src/screens/ o src/components/, lee DESIGN.md.

## 8. Tests en rojo esperados

Un sensor nunca se desactiva, se salta ni se borra. Solo se permite hacer commit con tests en rojo en estos dos
casos, y solo con confirmación de la usuaria:

- **a)** El test de colores fijos (`src/tema/coloresFijos.test.ts`), desde su creación hasta el ticket T-11 del
  backlog (Hito 4), siempre que solo falle por archivos que ya tenían colores fijos. Esos archivos son:
  `src/components/ui.tsx`, `src/context/AccesibilidadContext.tsx`, `src/screens/BuscarScreen.tsx` y
  `src/screens/EditarScreen.tsx`. Si el test marca cualquier otro archivo, no aplica este caso.
- **b)** El commit `test:` del Paso 12 (tests del dominio antes de implementar), solo con los tests nuevos de ese
  paso en rojo.

Cualquier otro test en rojo bloquea el commit. El mensaje del commit debe decir en el cuerpo qué tests quedan en
rojo y por qué.

## 9. Expo cambia entre versiones

Expo introduce cambios incompatibles en cada versión del SDK, así que las APIs que recuerdes pueden
tener otro nombre, estar en otro lugar o no existir. Antes de usar una API de Expo, consulta la
documentación de SDK 57: https://docs.expo.dev/versions/v57.0.0/
