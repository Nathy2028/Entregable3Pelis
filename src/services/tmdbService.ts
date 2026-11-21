import { armarDatosTmdb } from '../dominio/datosTmdb';
import type {
  DatosTmdb,
  DetalleObra,
  PaginaBusqueda,
  ResultadoBusqueda,
  TipoObra,
  TmdbDetalle,
  TmdbPagina,
  TmdbResultado,
} from '../types';
import { conTiempoMaximo } from './firebase';

const API = 'https://api.themoviedb.org/3';
// ponytail: images.secure_base_url de /configuration fijo; pedir /configuration al iniciar si TMDB lo cambiara.
const IMAGENES = 'https://image.tmdb.org/t/p/';
const IDIOMA = 'es-MX';

/** Tamaños de /configuration: pequeños para listas, grandes para el detalle. */
export type TamanoImagen = 'w185' | 'w342' | 'w500' | 'w780';

export function urlImagen(path: string | null, tamano: TamanoImagen): string | null {
  return path ? `${IMAGENES}${tamano}${path}` : null;
}

/** Fallo al pedir a TMDB. `status` es el código HTTP, o null si no hubo respuesta. */
export class TmdbError extends Error {
  constructor(
    mensaje: string,
    readonly status: number | null,
  ) {
    super(mensaje);
  }
}

async function pedir<T>(ruta: string, params: Record<string, string>): Promise<T> {
  const token = process.env.EXPO_PUBLIC_TMDB_TOKEN;
  if (!token) throw new TmdbError('Falta EXPO_PUBLIC_TMDB_TOKEN en el archivo .env.', null);

  const query = Object.entries({ language: IDIOMA, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API}${ruta}?${query}`, {
      headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    });
  } catch {
    throw new TmdbError('Sin conexión. Revisa tu internet y vuelve a intentarlo.', null);
  }
  const { status } = respuesta;
  if (status === 429)
    throw new TmdbError('TMDB recibió demasiadas peticiones. Espera unos segundos.', status);
  if (status === 401) throw new TmdbError('El token de TMDB no es válido. Revisa tu archivo .env.', status);
  if (!respuesta.ok) throw new TmdbError(`TMDB no respondió (error ${status}).`, status);
  return (await respuesta.json()) as T;
}

const anioDe = (r: Pick<TmdbResultado, 'release_date' | 'first_air_date'>) =>
  (r.release_date || r.first_air_date || '').slice(0, 4);

const esObra = (r: TmdbResultado): r is TmdbResultado & { media_type: TipoObra } =>
  r.media_type === 'movie' || r.media_type === 'tv';

/** Búsqueda combinada de películas y series (se descartan personas). */
export async function buscar(titulo: string, pagina = 1): Promise<PaginaBusqueda> {
  const r = await pedir<TmdbPagina<TmdbResultado>>('/search/multi', {
    query: titulo,
    page: String(pagina),
    include_adult: 'false',
  });
  const resultados: ResultadoBusqueda[] = r.results.filter(esObra).map((x) => ({
    tmdbId: x.id,
    tipo: x.media_type,
    titulo: x.title ?? x.name ?? 'Sin título',
    anio: anioDe(x),
    posterPath: x.poster_path,
    calificacion: x.vote_average,
  }));
  return { resultados, pagina: r.page, totalPaginas: r.total_pages, total: r.total_results };
}

function duracion(d: TmdbDetalle): string {
  if (d.runtime)
    return d.runtime < 60 ? `${d.runtime} min` : `${Math.floor(d.runtime / 60)} h ${d.runtime % 60} min`;
  if (d.number_of_seasons)
    return `${d.number_of_seasons} ${d.number_of_seasons === 1 ? 'temporada' : 'temporadas'}`;
  return '';
}

// Detalle y Editar piden la misma obra; se guarda en memoria para no repetir la petición.
const detalles = new Map<string, DetalleObra>();

/** Detalle + elenco + videos en una sola petición (append_to_response). */
export async function obtenerDetalle(tipo: TipoObra, id: number): Promise<DetalleObra> {
  const clave = `${tipo}_${id}`;
  const guardado = detalles.get(clave);
  if (guardado) return guardado;

  const d = await pedir<TmdbDetalle>(`/${tipo}/${id}`, {
    append_to_response: 'credits,videos',
    include_video_language: 'es,en', // sin esto solo llegan videos en español
  });
  const videos = d.videos?.results.filter((v) => v.site === 'YouTube') ?? [];
  const detalle: DetalleObra = {
    tmdbId: d.id,
    tipo,
    titulo: d.title ?? d.name ?? 'Sin título',
    anio: anioDe(d),
    posterPath: d.poster_path,
    backdropPath: d.backdrop_path,
    sinopsis: d.overview?.trim() ?? '',
    calificacion: d.vote_average,
    generos: d.genres.map((g) => g.name),
    duracion: duracion(d),
    elenco: (d.credits?.cast ?? []).slice(0, 15).map((c) => ({
      id: c.id,
      nombre: c.name,
      personaje: c.character,
      fotoPath: c.profile_path,
    })),
    trailerKey: (videos.find((v) => v.type === 'Trailer') ?? videos[0])?.key ?? null,
    datos: armarDatosTmdb(tipo, d),
  };
  detalles.set(clave, detalle);
  return detalle;
}

const ESPERA_AL_AGREGAR = 5000; // ms (P19)

/**
 * D5: géneros, duración y directores para guardar al agregar. Si TMDB falla o tarda más de 5 s devuelve null y la
 * obra se agrega sin ellos (P19); D6 la completa al abrir el resumen. Nunca lanza. Una respuesta que llega tarde
 * no se usa aquí, pero queda en la memoria del detalle.
 */
export async function obtenerDatosParaAgregar(tipo: TipoObra, id: number): Promise<DatosTmdb | null> {
  try {
    const detalle = await conTiempoMaximo(
      obtenerDetalle(tipo, id),
      ESPERA_AL_AGREGAR,
      () => new TmdbError('TMDB no respondió a tiempo.', null),
    );
    return detalle.datos;
  } catch {
    return null;
  }
}
