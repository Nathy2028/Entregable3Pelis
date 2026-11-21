// Hook PostToolUse (Edit|Write): formatea con Prettier el archivo que Claude acaba de editar.
// Nunca corta el flujo: cualquier error se escribe en stderr y el script termina con código 0.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const EXTENSIONES = new Set(['.ts', '.tsx', '.js', '.json', '.md']);

function leerStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function principal() {
  // PowerShell 5.1 antepone un BOM al texto que envía por pipe; JSON.parse no lo acepta.
  const entrada = JSON.parse(leerStdin().replace(/^﻿/, ''));
  const ruta = entrada && entrada.tool_input && entrada.tool_input.file_path;
  if (typeof ruta !== 'string' || ruta === '') return;

  const proyecto = path.resolve(process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd());
  const archivo = path.resolve(proyecto, ruta);

  if (!EXTENSIONES.has(path.extname(archivo).toLowerCase())) return;
  if (!fs.existsSync(archivo)) return;

  // Solo archivos dentro del proyecto (no planes ni memorias de ~/.claude).
  const relativa = path.relative(proyecto, archivo);
  if (relativa === '' || relativa.startsWith('..') || path.isAbsolute(relativa)) return;

  // shell: true es necesario en Windows para lanzar npx (npx.cmd). La ruta va entre comillas por si tiene espacios.
  const resultado = spawnSync('npx', ['prettier', '--write', `"${archivo}"`], {
    cwd: proyecto,
    shell: true,
    encoding: 'utf8',
  });

  if (resultado.error) {
    process.stderr.write(`[prettier hook] ${resultado.error.message}\n`);
  } else if (resultado.status !== 0) {
    process.stderr.write(`[prettier hook] Prettier falló en ${relativa}:\n${resultado.stderr || ''}\n`);
  }
}

try {
  principal();
} catch (error) {
  process.stderr.write(`[prettier hook] ${error instanceof Error ? error.message : String(error)}\n`);
}
process.exit(0);
