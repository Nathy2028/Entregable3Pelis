import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Sensor del sistema de diseño: fuera de src/tema/ no se escriben colores (DESIGN.md, AGENTS.md).
const RAIZ = join(__dirname, '..');
const TEMA = __dirname;

// Hexadecimal de 3, 4, 6 u 8 dígitos que no sea parte de otra palabra (evita, por ejemplo, this.#campo),
// y rgb( / rgba( en cualquier combinación de mayúsculas.
const HEX = /(?<![\w.#])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w])/gi;
const RGB = /\brgba?\s*\([^)]*\)/gi;

interface Hallazgo {
  archivo: string;
  linea: number;
  color: string;
}

function archivosDe(carpeta: string): string[] {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(carpeta, e.name);
    if (e.isDirectory()) return ruta === TEMA ? [] : archivosDe(ruta);
    return /\.tsx?$/.test(e.name) ? [ruta] : [];
  });
}

function buscarColores(): Hallazgo[] {
  return archivosDe(RAIZ).flatMap((ruta) => {
    const archivo = `src/${relative(RAIZ, ruta).split(sep).join('/')}`;
    return readFileSync(ruta, 'utf8')
      .split(/\r?\n/)
      .flatMap((texto, i) =>
        [...texto.matchAll(HEX), ...texto.matchAll(RGB)]
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
          .map((m) => ({ archivo, linea: i + 1, color: m[0] })),
      );
  });
}

describe('colores fijos', () => {
  it('ningún archivo fuera de src/tema/ escribe un color en hexadecimal o rgb()/rgba()', () => {
    const hallazgos = buscarColores().sort((a, b) => a.archivo.localeCompare(b.archivo) || a.linea - b.linea);
    const lista = hallazgos.map((h) => `  ${h.archivo}:${h.linea}  ${h.color}`).join('\n');
    const archivos = new Set(hallazgos.map((h) => h.archivo)).size;
    expect(
      hallazgos.length,
      `Colores fijos fuera de src/tema/ (${hallazgos.length} en ${archivos} archivos). Usa los tokens de DESIGN.md:\n${lista}\n`,
    ).toBe(0);
  });
});
