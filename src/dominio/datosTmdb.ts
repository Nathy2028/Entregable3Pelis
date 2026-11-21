import type { DatosTmdb, TipoObra, TmdbDetalle } from '../types';

const MAX_LISTA = 10; // las reglas de Firestore no aceptan listas más largas (P14)
const DURACION_MAXIMA = 1000; // minutos; fuera de 1–1000 las reglas rechazan la escritura (P13)

/** D5: géneros, duración y directores a partir del detalle de TMDB. En series no hay duración ni directores. */
export function armarDatosTmdb(
  tipo: TipoObra,
  d: Pick<TmdbDetalle, 'genres' | 'runtime' | 'credits'>,
): DatosTmdb {
  const generos = d.genres.map((g) => g.name).slice(0, MAX_LISTA);
  if (tipo === 'tv') return { generos, duracionMin: null, directores: [] };

  const runtime = d.runtime;
  const duracionMin =
    runtime !== undefined && Number.isInteger(runtime) && runtime >= 1 && runtime <= DURACION_MAXIMA
      ? runtime
      : null;
  const directores = [
    ...new Set((d.credits?.crew ?? []).filter((p) => p.job === 'Director').map((p) => p.name)),
  ].slice(0, MAX_LISTA);
  return { generos, duracionMin, directores };
}
