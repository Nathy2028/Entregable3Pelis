import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import type { CambiosItem, DatosTmdb, EstadoVisionado, ItemLista, Obra, TipoObra } from '../types';
import { guardarCache, leerCache } from './cache';
import { conTiempoMaximo, db } from './firebase';

const coleccion = (uid: string) => collection(db, 'usuarios', uid, 'mi_lista');

/** movie_550, tv_1399: TMDB numera aparte películas y series, y el id fijo evita duplicados. */
export const crearItemId = (tipo: TipoObra, tmdbId: number) => `${tipo}_${tmdbId}`;

/** Solo los campos de Obra (los objetos de TMDB traen más datos que no se guardan). */
export const soloObra = ({ tmdbId, tipo, titulo, anio, posterPath }: Obra): Obra => ({
  tmdbId,
  tipo,
  titulo,
  anio,
  posterPath,
});

/** Timestamp de Firestore o milisegundos de la copia local → ms. Si falta, null: no se inventa la fecha (H9). */
function aMs(t: unknown): number | null {
  if (t instanceof Timestamp) return t.toMillis();
  return typeof t === 'number' && Number.isFinite(t) ? t : null;
}

const ESTADOS: readonly EstadoVisionado[] = ['por_ver', 'viendo', 'vista'];
const texto = (v: unknown, otro = ''): string => (typeof v === 'string' ? v : otro);
const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const listaDeTexto = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : null;

/**
 * Convierte un documento de Firestore o una entrada de la copia de AsyncStorage en ItemLista.
 * Los documentos y copias de antes de la épica no tienen los campos nuevos: se leen como null.
 * Si falta `generos`, la obra nunca se completó desde TMDB (P9) y sus tres datos quedan en null.
 */
export function normalizarItem(crudo: Record<string, unknown>): ItemLista {
  const generos = listaDeTexto(crudo.generos);
  return {
    id: texto(crudo.id),
    tmdbId: numero(crudo.tmdbId) ?? 0,
    tipo: crudo.tipo === 'tv' ? 'tv' : 'movie',
    titulo: texto(crudo.titulo, 'Sin título'),
    anio: texto(crudo.anio),
    posterPath: typeof crudo.posterPath === 'string' ? crudo.posterPath : null,
    estado: ESTADOS.find((e) => e === crudo.estado) ?? 'por_ver',
    calificacionPersonal: numero(crudo.calificacionPersonal),
    comentario: texto(crudo.comentario),
    agregadoEn: aMs(crudo.agregadoEn),
    actualizadoEn: aMs(crudo.actualizadoEn),
    vistaEn: aMs(crudo.vistaEn),
    generos,
    duracionMin: generos ? numero(crudo.duracionMin) : null,
    directores: generos ? (listaDeTexto(crudo.directores) ?? []) : null,
  };
}

export async function obtener(uid: string): Promise<ItemLista[]> {
  const snap = await conTiempoMaximo(getDocs(query(coleccion(uid), orderBy('agregadoEn', 'desc'))));
  return snap.docs.map((d) => normalizarItem({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id }));
}

/**
 * Con `datos` escribe también los 3 campos de TMDB (D5); con null no escribe ninguno (P19, P9): así la obra queda
 * como "nunca completada" y D6 la completa después.
 */
export async function agregar(uid: string, obra: Obra, datos: DatosTmdb | null): Promise<void> {
  await conTiempoMaximo(
    setDoc(doc(coleccion(uid), crearItemId(obra.tipo, obra.tmdbId)), {
      ...soloObra(obra),
      estado: 'por_ver',
      calificacionPersonal: null,
      comentario: '',
      agregadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
      // Campo por campo: las reglas usan hasOnly y no aceptan claves de más.
      ...(datos && { generos: datos.generos, duracionMin: datos.duracionMin, directores: datos.directores }),
    }),
  );
}

export async function actualizar(uid: string, itemId: string, cambios: CambiosItem): Promise<void> {
  await conTiempoMaximo(
    updateDoc(doc(coleccion(uid), itemId), { ...cambios, actualizadoEn: serverTimestamp() }),
  );
}

export async function eliminar(uid: string, itemId: string): Promise<void> {
  await conTiempoMaximo(deleteDoc(doc(coleccion(uid), itemId)));
}

// ---------- Copia local (RF8) ----------

const claveCache = (uid: string) => `cartelera:lista:${uid}`;
/** La copia puede ser de antes de la épica: cada entrada pasa por normalizarItem. */
export async function leerCacheLista(uid: string): Promise<ItemLista[] | null> {
  const copia = await leerCache<unknown>(claveCache(uid));
  if (!Array.isArray(copia)) return null;
  return copia
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map(normalizarItem)
    .filter((item) => item.id !== '');
}
export const guardarCacheLista = (uid: string, lista: ItemLista[]) => guardarCache(claveCache(uid), lista);
