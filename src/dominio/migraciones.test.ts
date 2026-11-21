import { describe, expect, it } from 'vitest';
import type { ItemLista } from '../types';
import { accionAnteFalloTmdb, obrasParaCompletar, obrasParaFechar } from './migraciones';
import type { Calendario } from './resumenAnual';

// Teléfono simulado en UTC−5 (igual que en resumenAnual.test.ts).
const ZONA = -5 * 60 * 60 * 1000;
const calendario: Calendario = (ms) => {
  const local = new Date(ms + ZONA);
  return { anio: local.getUTCFullYear(), mes: local.getUTCMonth() };
};
const enMes = (anio: number, mes: number, dia = 15) => Date.UTC(anio, mes, dia, 12) - ZONA;

let siguiente = 0;
/** Película "vista" en junio de 2025, completada desde TMDB. */
function obra(p: Partial<ItemLista> = {}): ItemLista {
  siguiente += 1;
  return {
    id: `movie_${siguiente}`,
    tmdbId: siguiente,
    tipo: 'movie',
    titulo: `Obra ${siguiente}`,
    anio: '2020',
    posterPath: null,
    estado: 'vista',
    calificacionPersonal: null,
    comentario: '',
    agregadoEn: enMes(2025, 0),
    actualizadoEn: enMes(2025, 0),
    vistaEn: enMes(2025, 5),
    generos: [],
    duracionMin: 100,
    directores: [],
    ...p,
  };
}
const sinDatos = (p: Partial<ItemLista> = {}) =>
  obra({ generos: null, duracionMin: null, directores: null, ...p });
const completar = (items: ItemLista[], descartadas: string[] = []) =>
  obrasParaCompletar(items, 2025, calendario, new Set(descartadas));

describe('obrasParaFechar', () => {
  it('CA-A.4.1 vista sin vistaEn recibe actualizadoEn', () => {
    const vieja = obra({ vistaEn: null, actualizadoEn: enMes(2023, 9) });
    expect(obrasParaFechar([vieja])).toEqual([{ itemId: vieja.id, vistaEn: enMes(2023, 9) }]);
  });

  it('CA-A.4.2 después de migrar no queda nada por fechar', () => {
    const items = [obra({ vistaEn: null, actualizadoEn: enMes(2023, 9) }), obra()];
    const cambios = obrasParaFechar(items);
    const migrada = items.map((i) => {
      const c = cambios.find((x) => x.itemId === i.id);
      return c ? { ...i, vistaEn: c.vistaEn } : i;
    });
    expect(obrasParaFechar(migrada)).toEqual([]);
  });

  it('CA-A.4.3 no toca obras no vistas ni las que ya tienen fecha', () => {
    const items = [
      obra({ estado: 'por_ver', vistaEn: null }),
      obra({ estado: 'viendo', vistaEn: null }),
      obra({ vistaEn: enMes(2025, 2) }),
    ];
    expect(obrasParaFechar(items)).toEqual([]);
  });

  it('CA-A.4.4 sin actualizadoEn no se migra', () => {
    expect(obrasParaFechar([obra({ vistaEn: null, actualizadoEn: null })])).toEqual([]);
  });
});

describe('obrasParaCompletar', () => {
  it('CA-A.4.6 elige las obras vistas del año sin datos', () => {
    const a = sinDatos();
    const c = sinDatos({ vistaEn: enMes(2025, 10) });
    const items = [
      a,
      obra(), // completada
      c,
      sinDatos({ estado: 'por_ver', vistaEn: null }), // no está vista
      sinDatos({ vistaEn: null }), // vista sin fecha: no se sabe de qué año es
    ];
    expect(completar(items)).toEqual([a, c]);
  });

  it('CA-A.4.7 no elige obras de otros años', () => {
    const deEsteAnio = sinDatos();
    expect(completar([deEsteAnio, sinDatos({ vistaEn: enMes(2024, 5) })])).toEqual([deEsteAnio]);
  });

  it('CA-A.4.9 no elige las descartadas', () => {
    const descartada = sinDatos();
    const otra = sinDatos();
    expect(completar([descartada, otra], [descartada.id])).toEqual([otra]);
  });

  it('CA-A.4.10 con generos vacío no se vuelve a pedir', () => {
    expect(completar([obra({ generos: [], duracionMin: null, directores: [] })])).toEqual([]);
  });

  it('CA-A.4.12 una obra agregada sin datos entra en la selección', () => {
    // Se agregó con TMDB caído (P19) y después se marcó como vista en 2025.
    const agregadaSinDatos = sinDatos({ vistaEn: enMes(2025, 7), calificacionPersonal: 4 });
    expect(completar([agregadaSinDatos])).toEqual([agregadaSinDatos]);
  });
});

describe('accionAnteFalloTmdb', () => {
  it('CA-A.4.9 404 descarta; 429 y sin respuesta reintentan', () => {
    expect(accionAnteFalloTmdb(404)).toBe('descartar');
    expect(accionAnteFalloTmdb(429)).toBe('reintentar');
    expect(accionAnteFalloTmdb(500)).toBe('reintentar');
    expect(accionAnteFalloTmdb(null)).toBe('reintentar');
  });
});
