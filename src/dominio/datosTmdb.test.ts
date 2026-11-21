import { describe, expect, it } from 'vitest';
import { armarDatosTmdb } from './datosTmdb';

const generos = (...nombres: string[]) => nombres.map((name, id) => ({ id, name }));
const equipo = (...personas: [string, string][]) => personas.map(([name, job]) => ({ name, job }));

describe('armarDatosTmdb', () => {
  it('CA-A.2.4 película: géneros, duración y directores', () => {
    const datos = armarDatosTmdb('movie', {
      genres: generos('Drama', 'Ciencia ficción'),
      runtime: 117,
      credits: {
        cast: [],
        crew: equipo(
          ['Ana Director', 'Director'],
          ['Beto Guion', 'Writer'],
          ['Carla Director', 'Director'],
          ['Ana Director', 'Director'],
        ),
      },
    });
    expect(datos).toEqual({
      generos: ['Drama', 'Ciencia ficción'],
      duracionMin: 117,
      directores: ['Ana Director', 'Carla Director'],
    });
  });

  it('CA-A.2.4 película sin equipo técnico: directores vacío', () => {
    expect(armarDatosTmdb('movie', { genres: generos('Drama'), runtime: 90 }).directores).toEqual([]);
  });

  it('CA-A.2.5 serie: duracionMin null y directores vacío', () => {
    const datos = armarDatosTmdb('tv', {
      genres: generos('Drama'),
      runtime: 45,
      credits: { cast: [], crew: equipo(['Dana Directora', 'Director']) },
    });
    expect(datos).toEqual({ generos: ['Drama'], duracionMin: null, directores: [] });
  });

  it('CA-A.2.6 duración 0 o mayor que 1000: null', () => {
    const duracion = (runtime: number) => armarDatosTmdb('movie', { genres: [], runtime }).duracionMin;
    expect(duracion(0)).toBeNull();
    expect(duracion(1001)).toBeNull();
    expect(duracion(1)).toBe(1);
    expect(duracion(1000)).toBe(1000);
  });

  it('CA-A.2.7 más de 10 géneros o directores: los 10 primeros', () => {
    const doce = Array.from({ length: 12 }, (_, i) => `N${i + 1}`);
    const datos = armarDatosTmdb('movie', {
      genres: generos(...doce),
      runtime: 100,
      credits: { cast: [], crew: equipo(...doce.map((n): [string, string] => [n, 'Director'])) },
    });
    expect(datos.generos).toEqual(doce.slice(0, 10));
    expect(datos.directores).toEqual(doce.slice(0, 10));
  });
});
