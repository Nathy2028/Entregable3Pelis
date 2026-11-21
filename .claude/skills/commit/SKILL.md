---
name: commit
description: Crea un commit de este proyecto siguiendo las reglas de AGENTS.md (stage explícito, pruebas y tipos antes de commitear código, mensaje en español con prefijo y confirmación previa).
disable-model-invocation: true
---

# /commit

Sigue estos pasos en orden. Si algún paso dice "detente", no continúes con los siguientes.

## 1. Revisar el estado

Ejecuta:

```bash
git status
git diff --staged
```

## 2. Si no hay nada en stage

- Muestra la lista de archivos modificados y nuevos que da `git status`.
- **Pregunta** qué archivos agregar y espera la respuesta.
- Agrega solo lo que se indique, con rutas explícitas: `git add <ruta> <ruta>`.
- **Prohibido:** `git add -A`, `git add .`, `git add --all`, `git commit -a`.
- **Nunca** agregues `.env` ni ningún archivo `.env*`, aunque lo pidan. No leas ni muestres su contenido.

## 3. Comprobar que no haya secretos en stage

Si `git diff --staged --name-only` incluye algún `.env*`, **detente**: avisa y sugiere `git restore --staged <archivo>`. No hagas commit.

## 4. Pruebas y tipos (solo si hay código TypeScript)

Si algún archivo en stage termina en `.ts` o `.tsx`, ejecuta:

```bash
npm test
npx tsc --noEmit
```

- Si **cualquiera** falla, muestra el error y **detente**. No hagas commit.
- "Missing script: test" también cuenta como fallo (el script `test` todavía no existe; llega con Vitest).
- Nunca borres, desactives ni saltes tests para que pasen. Nunca uses `--no-verify`.

## 5. Proponer el mensaje

Formato:

- Prefijo en minúsculas: `docs:`, `feat:`, `fix:`, `test:` o `chore:`.
- En español, con el verbo en presente: "agrega", "corrige", "documenta", "actualiza".
- Primera línea de **máximo 72 caracteres** (cuéntalos).
- Cuerpo opcional, separado por una línea en blanco, si hace falta explicar el porqué.

Guía de prefijos:

| Prefijo  | Cuándo                                                          |
| -------- | --------------------------------------------------------------- |
| `docs:`  | Solo documentación (specs, AGENTS.md, README, etc.)             |
| `feat:`  | Funcionalidad nueva de la app                                   |
| `fix:`   | Corrección de un error                                          |
| `test:`  | Solo pruebas                                                    |
| `chore:` | Configuración, dependencias, harness (`.claude/`), herramientas |

Regla del proyecto: **ningún código sin su documento**. Si el stage mezcla documentación y código de `src/`, sugiere separarlo: primero el commit `docs:` y después el de código.

## 6. Esperar confirmación

Muestra el mensaje completo y la lista de archivos que entrarán, y **pregunta si se confirma**. No ejecutes `git commit` hasta recibir un sí explícito. Si piden cambios al mensaje, vuelve a mostrarlo y espera de nuevo.

## 7. Hacer el commit

Usa un heredoc para que el mensaje quede exacto, y termina con la línea de coautoría:

```bash
git commit -F - <<'EOF'
chore: ejemplo de mensaje

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- Nunca `--amend`, `--no-verify` ni `git push` (salvo que se pida explícitamente).
- Si un hook de git falla, muestra el error y detente; no lo saltes.

## 8. Verificar

```bash
git log --oneline -1
git status
```

Muestra el resultado.
