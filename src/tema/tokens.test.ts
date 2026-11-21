import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { espacio, PALETA, PALETA_CONTRASTE, radio, TIPOGRAFIA, TOQUE, type EstiloTexto } from './tokens';

// Los tokens de src/tema/ son los del brand board v3: si cambia uno de los dos, este test lo marca.
const BOARD = readFileSync(join(__dirname, '..', '..', 'docs', 'diseno', 'brand-board.html'), 'utf8');

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Contenido del primer bloque CSS `selector { … }` del board. */
function bloque(selector: string): string {
  const encontrado = BOARD.match(new RegExp(`${escapar(selector)}\\s*\\{([^}]*)\\}`));
  if (!encontrado?.[1]) throw new Error(`El board no tiene el bloque ${selector}`);
  return encontrado[1];
}

/** Variables `--nombre: valor;` de un bloque. */
function variables(selector: string): Record<string, string> {
  return Object.fromEntries(
    [...bloque(selector).matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], (m[2] ?? '').trim()]),
  );
}

/** Propiedades `nombre: valor;` de una regla CSS. */
function propiedades(selector: string): Record<string, string> {
  return Object.fromEntries(
    [...bloque(selector).matchAll(/([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], (m[2] ?? '').trim()]),
  );
}

const esColor = (valor: string) => /^(#|rgba?\()/i.test(valor);
/** "#d4ff3a" = "#D4FF3A" y "rgba(0,0,0,.85)" = "rgba(0, 0, 0, .85)". */
const normalizar = (valor: string) => valor.replace(/\s+/g, '').toLowerCase();
const soloColores = (vars: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(vars)
      .filter(([, v]) => esColor(v))
      .map(([k, v]) => [k, normalizar(v)]),
  );
const paletaNormalizada = (paleta: Record<string, string>) =>
  Object.fromEntries(Object.entries(paleta).map(([k, v]) => [k, normalizar(v)]));
/** "--esp-m: 12px" → { m: 12 } para el prefijo "esp-". */
const medidas = (vars: Record<string, string>, prefijo: string) =>
  Object.fromEntries(
    Object.entries(vars)
      .filter(([k]) => k.startsWith(prefijo))
      .map(([k, v]) => [k.slice(prefijo.length), parseFloat(v)]),
  );

const raiz = variables(':root');
const contraste = variables('body.contraste');

describe('tokens = brand board v3', () => {
  it('paleta normal: los mismos colores que :root, ni uno más ni uno menos', () => {
    expect(paletaNormalizada(PALETA)).toEqual(soloColores(raiz));
  });

  it('alto contraste: los de body.contraste y, si el board no los cambia, los de :root', () => {
    expect(paletaNormalizada(PALETA_CONTRASTE)).toEqual({ ...soloColores(raiz), ...soloColores(contraste) });
  });

  it('espacios esp-*, radios y área táctil', () => {
    expect(espacio).toEqual(medidas(raiz, 'esp-'));
    expect(radio).toEqual(medidas(raiz, 'r-'));
    expect(TOQUE).toBe(parseFloat(raiz.toque ?? ''));
  });

  it.each(Object.keys(TIPOGRAFIA) as (keyof typeof TIPOGRAFIA)[])('tipografía: %s', (nombre) => {
    const css = propiedades(`.t-${nombre}`);
    const tamano = parseFloat(css['font-size'] ?? '');
    const linea = css['line-height'];
    const desdeBoard: EstiloTexto = {
      tamano,
      peso: (css['font-weight'] ?? '400') as EstiloTexto['peso'],
      espaciado: css['letter-spacing'] === undefined ? undefined : parseFloat(css['letter-spacing']),
      // line-height sin unidad es un múltiplo del tamaño (line-height: 1 → 48 en "dato").
      linea:
        linea === undefined
          ? undefined
          : linea.endsWith('px')
            ? parseFloat(linea)
            : parseFloat(linea) * tamano,
      // Sin color propio, el texto hereda el del cuerpo de la página: `texto`.
      color: (css.color?.match(/var\(--(\w+)\)/)?.[1] ?? 'texto') as EstiloTexto['color'],
      mayusculas: css['text-transform'] === 'uppercase' || undefined,
      tabular: css['font-variant-numeric'] === 'tabular-nums' || undefined,
    };
    const token: EstiloTexto = TIPOGRAFIA[nombre];
    expect({ ...token, peso: token.peso ?? '400' }).toEqual(desdeBoard);
  });
});
