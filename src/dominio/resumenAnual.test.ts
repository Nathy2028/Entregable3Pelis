import { describe, expect, it } from 'vitest';
import type { ItemLista } from '../types';
import { aniosDisponibles, formatearHoras, resumenAnual, type Calendario } from './resumenAnual';

// Teléfono simulado en UTC−5: los tests no dependen de la zona horaria del computador (CA-A.2.1).
const ZONA = -5 * 60 * 60 * 1000;
const calendario: Calendario = (ms) => {
  const local = new Date(ms + ZONA);
  return { anio: local.getUTCFullYear(), mes: local.getUTCMonth() };
};
/** Mediodía local del día `dia` del mes `mes` (enero = 0). */
const enMes = (anio: number, mes: number, dia = 15) => Date.UTC(anio, mes, dia, 12) - ZONA;

let siguiente = 0;
/** Película "vista" en junio de 2025, completada desde TMDB, sin calificar. */
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
const serie = (p: Partial<ItemLista> = {}) => obra({ tipo: 'tv', duracionMin: null, directores: [], ...p });
const resumen = (items: ItemLista[], anio = 2025) => resumenAnual(items, anio, calendario);

describe('resumenAnual', () => {
  // ---------- D3: a qué año pertenece cada obra ----------

  it('CA-A.2.1 vista el 31/12 a las 23:30 hora local cuenta en ese año', () => {
    const nochevieja = obra({ vistaEn: Date.UTC(2026, 0, 1, 4, 30) }); // 31/12/2025 23:30 en UTC−5
    expect(resumen([nochevieja], 2025).totalObras).toBe(1);
    expect(resumen([nochevieja], 2026).totalObras).toBe(0);
  });

  it('CA-A.2.2 cada obra cuenta una vez y no cuentan las de otros años', () => {
    const a = obra();
    const b = obra({ vistaEn: enMes(2025, 8) });
    const deOtroAnio = obra({ vistaEn: enMes(2024, 3) });
    expect(resumen([a, a, b, deOtroAnio]).totalObras).toBe(2);
  });

  it('CA-A.2.3 total = películas + series', () => {
    const r = resumen([obra(), obra(), obra(), serie(), serie()]);
    expect(r.totalObras).toBe(5);
    expect(r.peliculas).toBe(3);
    expect(r.series).toBe(2);
  });

  // ---------- D7: horas de cine ----------

  it('CA-A.2.10 2250 minutos son 37,5 h', () => {
    const peliculas = [100, 500, 650, 1000].map((duracionMin) => obra({ duracionMin }));
    expect(resumen(peliculas).horas).toBe(37.5);
    expect(resumen([obra({ duracionMin: 100 })]).horas).toBe(1.7);
  });

  it('CA-A.2.11 las series no suman horas', () => {
    const r = resumen([obra({ duracionMin: 120 }), serie({ duracionMin: 45 })]);
    expect(r.horas).toBe(2);
    expect(r.totalObras).toBe(2);
  });

  it('CA-A.2.12 película sin duración: no suma y cuenta en peliculasSinDuracion', () => {
    const sinDuracion = obra({ duracionMin: null });
    const sinDatos = obra({ generos: null, duracionMin: null, directores: null });
    const r = resumen([obra({ duracionMin: 60 }), sinDuracion, sinDatos]);
    expect(r.horas).toBe(1);
    expect(r.peliculasSinDuracion).toBe(1);
  });

  // ---------- D8: género más visto ----------

  it('CA-A.2.13 gana el género con más obras', () => {
    const items = [
      ...Array.from({ length: 3 }, () => obra({ generos: ['Drama'] })),
      ...Array.from({ length: 2 }, () => obra({ generos: ['Comedia'] })),
    ];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Drama', obras: 3 });
  });

  it('CA-A.2.13 una obra con dos géneros suma 1 a cada uno', () => {
    const items = [obra({ generos: ['Drama', 'Comedia'] }), obra({ generos: ['Comedia'] })];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Comedia', obras: 2 });
  });

  it('CA-A.2.14 empate de géneros: gana el de mayor promedio', () => {
    const items = [
      obra({ generos: ['Drama'], calificacionPersonal: 4 }),
      obra({ generos: ['Drama'], calificacionPersonal: 4 }),
      obra({ generos: ['Comedia'], calificacionPersonal: 3 }),
      obra({ generos: ['Comedia'], calificacionPersonal: 3 }),
    ];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Drama', obras: 2 });
  });

  it('CA-A.2.15 empate de géneros: el que no tiene calificadas pierde', () => {
    const items = [
      obra({ generos: ['Animación'] }),
      obra({ generos: ['Animación'] }),
      obra({ generos: ['Western'], calificacionPersonal: 1 }),
      obra({ generos: ['Western'] }),
    ];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Western', obras: 2 });
  });

  it('CA-A.2.16 empate sin calificadas: orden alfabético', () => {
    const items = [obra({ generos: ['Drama'] }), obra({ generos: ['Comedia'] })];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Comedia', obras: 1 });
  });

  it('CA-A.2.17 mismo promedio exacto: Acción antes que Animación', () => {
    const items = [
      obra({ generos: ['Animación'], calificacionPersonal: 4 }),
      obra({ generos: ['Animación'], calificacionPersonal: 4 }),
      obra({ generos: ['Acción'], calificacionPersonal: 5 }),
      obra({ generos: ['Acción'], calificacionPersonal: 3 }),
    ];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Acción', obras: 2 });
    // P2: sin distinguir mayúsculas ni tildes.
    const minusculas = [obra({ generos: ['Animación'] }), obra({ generos: ['acción'] })];
    expect(resumen(minusculas).generoTop).toEqual({ nombre: 'acción', obras: 1 });
  });

  it('CA-A.2.18 las series suman géneros', () => {
    const items = [
      serie({ generos: ['Drama'], calificacionPersonal: 5 }),
      obra({ generos: ['Comedia'], calificacionPersonal: 2 }),
    ];
    expect(resumen(items).generoTop).toEqual({ nombre: 'Drama', obras: 1 });
  });

  // ---------- D9: director más visto ----------

  it('CA-A.2.19 solo cuentan los directores de películas', () => {
    const items = [
      serie({ directores: ['Xavier'] }),
      serie({ directores: ['Xavier'] }),
      obra({ directores: ['Yolanda'] }),
    ];
    expect(resumen(items).directorTop).toEqual({ nombre: 'Yolanda', obras: 1 });
  });

  it('CA-A.2.19 una película con dos directores suma 1 a cada uno', () => {
    const items = [obra({ directores: ['Ana', 'Beto'] }), obra({ directores: ['Beto'] })];
    expect(resumen(items).directorTop).toEqual({ nombre: 'Beto', obras: 2 });
  });

  it('CA-A.2.20 empate de directores: gana el de mayor promedio', () => {
    const items = [
      obra({ directores: ['Ana'], calificacionPersonal: 4 }),
      obra({ directores: ['Ana'], calificacionPersonal: 4 }),
      obra({ directores: ['Zoe'], calificacionPersonal: 5 }),
      obra({ directores: ['Zoe'], calificacionPersonal: 5 }),
    ];
    expect(resumen(items).directorTop).toEqual({ nombre: 'Zoe', obras: 2 });
  });

  it('CA-A.2.21 empate total de directores: orden alfabético', () => {
    const items = [
      obra({ directores: ['Zoe'], calificacionPersonal: 3 }),
      obra({ directores: ['Ana'], calificacionPersonal: 3 }),
    ];
    expect(resumen(items).directorTop).toEqual({ nombre: 'Ana', obras: 1 });
  });

  it('CA-A.2.22 sin directores: directorTop null', () => {
    const items = [serie(), obra({ directores: [] })];
    expect(resumen(items).directorTop).toBeNull();
  });

  // ---------- D10: mes más activo ----------

  it('CA-A.2.23 gana el mes con más obras', () => {
    const items = [
      ...Array.from({ length: 4 }, () => obra({ vistaEn: enMes(2025, 2) })),
      ...Array.from({ length: 2 }, () => obra({ vistaEn: enMes(2025, 6) })),
    ];
    expect(resumen(items).mesTop).toBe(2);
  });

  it('CA-A.2.24 empate de meses: gana el más reciente', () => {
    const items = [
      ...Array.from({ length: 3 }, () => obra({ vistaEn: enMes(2025, 2) })),
      ...Array.from({ length: 3 }, () => obra({ vistaEn: enMes(2025, 11) })),
    ];
    expect(resumen(items).mesTop).toBe(11);
  });

  it('CA-A.2.25 obrasPorMes tiene siempre 12 posiciones', () => {
    const r = resumen([obra({ vistaEn: enMes(2025, 4) }), obra({ vistaEn: enMes(2025, 4, 20) })]);
    expect(r.obrasPorMes).toHaveLength(12);
    expect(r.obrasPorMes[4]).toBe(2);
    expect(r.obrasPorMes.filter((n) => n === 0)).toHaveLength(11);
  });

  it('CA-A.2.26 año sin obras: mesTop null y 12 ceros', () => {
    const r = resumen([obra({ vistaEn: enMes(2024, 4) })], 2025);
    expect(r.mesTop).toBeNull();
    expect(r.obrasPorMes).toEqual(Array(12).fill(0));
  });

  // ---------- D11: obra destacada ----------

  it('CA-A.2.27 la destacada es la de mayor calificación', () => {
    const mejor = obra({ calificacionPersonal: 5 });
    const items = [obra({ calificacionPersonal: 3 }), mejor, obra({ calificacionPersonal: 4 })];
    expect(resumen(items).destacada?.id).toBe(mejor.id);
  });

  it('CA-A.2.28 empate de calificación: gana la vista más reciente', () => {
    const reciente = obra({ calificacionPersonal: 5, vistaEn: enMes(2025, 9) });
    const items = [obra({ calificacionPersonal: 5, vistaEn: enMes(2025, 5) }), reciente];
    expect(resumen(items).destacada?.id).toBe(reciente.id);
  });

  it('CA-A.2.29 mismo vistaEn: gana el título en orden alfabético', () => {
    const alfa = obra({ titulo: 'Alfa', calificacionPersonal: 5, vistaEn: enMes(2025, 5) });
    const items = [obra({ titulo: 'Zeta', calificacionPersonal: 5, vistaEn: enMes(2025, 5) }), alfa];
    expect(resumen(items).destacada?.id).toBe(alfa.id);
  });

  it('CA-A.2.30 una obra sin calificar no le gana a una con 1', () => {
    const conUno = obra({ calificacionPersonal: 1, vistaEn: enMes(2025, 1) });
    const items = [obra({ calificacionPersonal: null, vistaEn: enMes(2025, 10) }), conUno];
    expect(resumen(items).destacada?.id).toBe(conUno.id);
  });

  it('CA-A.2.31 ninguna calificada: destacada null', () => {
    expect(resumen([obra(), serie()]).destacada).toBeNull();
  });

  // ---------- D6, D12 y D13 ----------

  it('CA-A.4.8 obra sin datos: cuenta en el total, no en horas, género ni director', () => {
    const r = resumen([obra({ generos: null, duracionMin: null, directores: null })]);
    expect(r.totalObras).toBe(1);
    expect(r.obrasSinDatos).toBe(1);
    expect(r.horas).toBe(0);
    expect(r.peliculasSinDuracion).toBe(0);
    expect(r.generoTop).toBeNull();
    expect(r.directorTop).toBeNull();
  });

  it('CA-A.5.1 año sin obras vistas: totalObras 0', () => {
    expect(resumen([]).totalObras).toBe(0);
    expect(resumen([obra({ vistaEn: enMes(2024, 4) })], 2025).totalObras).toBe(0);
  });

  it('CA-A.5.2 obras por ver o viendo no cuentan', () => {
    const items = [
      obra({ estado: 'por_ver', vistaEn: enMes(2025, 3) }),
      obra({ estado: 'viendo', vistaEn: enMes(2025, 3) }),
    ];
    expect(resumen(items).totalObras).toBe(0);
  });

  it('CA-A.5.5 obras vistas sin fecha: obrasSinFecha', () => {
    const r = resumen([obra({ vistaEn: null }), obra({ vistaEn: null }), obra()]);
    expect(r.obrasSinFecha).toBe(2);
    expect(r.totalObras).toBe(1);
  });
});

describe('formatearHoras', () => {
  it('CA-A.2.10 37,5 se escribe con coma', () => {
    expect(formatearHoras(37.5)).toBe('37,5 h');
    expect(formatearHoras(1.7)).toBe('1,7 h');
  });
});

describe('aniosDisponibles', () => {
  const anios = (items: ItemLista[], anioActual: number) => aniosDisponibles(items, anioActual, calendario);

  it('CA-A.3.1 años con obras vistas más el actual, de mayor a menor', () => {
    const items = [
      obra({ vistaEn: enMes(2022, 3) }),
      obra({ vistaEn: enMes(2024, 7) }),
      obra({ estado: 'por_ver', vistaEn: null, agregadoEn: enMes(2023, 1) }),
      obra({ vistaEn: null }),
    ];
    expect(anios(items, 2026)).toEqual([2026, 2024, 2022]);
  });

  it('CA-A.3.2 el año actual aparece aunque no tenga obras', () => {
    expect(anios([], 2026)).toEqual([2026]);
    expect(anios([obra({ vistaEn: enMes(2024, 7) })], 2026)).toEqual([2026, 2024]);
  });

  it('CA-A.3.3 el año actual no se repite', () => {
    const items = [
      obra({ vistaEn: enMes(2026, 1) }),
      obra({ vistaEn: enMes(2026, 6) }),
      obra({ vistaEn: enMes(2025, 4) }),
    ];
    expect(anios(items, 2026)).toEqual([2026, 2025]);
  });

  it('CA-A.3.5 año actual en el futuro: aparece igual', () => {
    expect(anios([obra({ vistaEn: enMes(2024, 7) })], 2030)).toEqual([2030, 2024]);
  });
});
