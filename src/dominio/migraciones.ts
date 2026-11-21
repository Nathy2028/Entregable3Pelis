import type { ItemLista } from '../types';
import type { Calendario } from './resumenAnual';

/** D2: obras vistas sin vistaEn que se pueden fechar con su actualizadoEn (P6). Pendiente de implementar en T-03. */
export function obrasParaFechar(items: ItemLista[]): { itemId: string; vistaEn: number }[] {
  throw new Error('no implementado');
}

/** D6: obras vistas del año elegido que nunca se completaron desde TMDB (P7, P9, P19). Pendiente de implementar en T-03. */
export function obrasParaCompletar(
  items: ItemLista[],
  anio: number,
  calendario: Calendario,
  descartadas: ReadonlySet<string>,
): ItemLista[] {
  throw new Error('no implementado');
}

/** P7: qué hacer cuando TMDB falla para una obra (`null` = sin respuesta). Pendiente de implementar en T-03. */
export function accionAnteFalloTmdb(status: number | null): 'reintentar' | 'descartar' {
  throw new Error('no implementado');
}
