import type { DatosTmdb, TipoObra, TmdbDetalle } from '../types';

/** D5: géneros, duración y directores a partir del detalle de TMDB (P13, P14). Pendiente de implementar en T-03. */
export function armarDatosTmdb(
  tipo: TipoObra,
  d: Pick<TmdbDetalle, 'genres' | 'runtime' | 'credits'>,
): DatosTmdb {
  throw new Error('no implementado');
}
