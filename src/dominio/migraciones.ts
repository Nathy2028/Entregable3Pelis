import type { ItemLista } from '../types';
import type { Calendario } from './resumenAnual';

/** D2: obras vistas sin vistaEn reciben su actualizadoEn. Sin actualizadoEn no se migran (P6). */
export function obrasParaFechar(items: ItemLista[]): { itemId: string; vistaEn: number }[] {
  return items.flatMap((i) =>
    i.estado === 'vista' && i.vistaEn === null && i.actualizadoEn !== null
      ? [{ itemId: i.id, vistaEn: i.actualizadoEn }]
      : [],
  );
}

/**
 * D6: obras vistas del año elegido que nunca se completaron desde TMDB (generos === null, P9), en el orden de la
 * lista. Las que TMDB ya no tiene (404) están en `descartadas` y no se vuelven a pedir (P7).
 */
export function obrasParaCompletar(
  items: ItemLista[],
  anio: number,
  calendario: Calendario,
  descartadas: ReadonlySet<string>,
): ItemLista[] {
  return items.filter(
    (i) =>
      i.estado === 'vista' &&
      i.vistaEn !== null &&
      calendario(i.vistaEn).anio === anio &&
      i.generos === null &&
      !descartadas.has(i.id),
  );
}

/** P7: si TMDB ya no tiene la obra (404) no se vuelve a pedir; cualquier otro fallo se reintenta la próxima vez. */
export function accionAnteFalloTmdb(status: number | null): 'reintentar' | 'descartar' {
  return status === 404 ? 'descartar' : 'reintentar';
}
