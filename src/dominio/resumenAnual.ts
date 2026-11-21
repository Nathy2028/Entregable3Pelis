import type { ItemLista } from '../types';

/** Año y mes (enero = 0) de un instante en la hora local del teléfono. Llega como parámetro: el dominio no lee la hora del sistema. */
export type Calendario = (ms: number) => { anio: number; mes: number };

export interface ResumenAnual {
  anio: number;
  totalObras: number;
  peliculas: number;
  series: number;
  horas: number; // con un decimal (D7)
  peliculasSinDuracion: number;
  obrasSinDatos: number; // D6
  generoTop: { nombre: string; obras: number } | null;
  directorTop: { nombre: string; obras: number } | null;
  obrasPorMes: number[]; // 12 posiciones, enero = 0 (D10)
  mesTop: number | null;
  destacada: ItemLista | null; // D11
  obrasSinFecha: number; // obras "vista" sin vistaEn, de cualquier año (P3)
}

/** Resumen de las obras vistas en `anio` (D3–D11). Pendiente de implementar en T-03. */
export function resumenAnual(items: ItemLista[], anio: number, calendario: Calendario): ResumenAnual {
  throw new Error('no implementado');
}

/** Años con obras vistas más el actual, de mayor a menor (D4). Pendiente de implementar en T-03. */
export function aniosDisponibles(items: ItemLista[], anioActual: number, calendario: Calendario): number[] {
  throw new Error('no implementado');
}

/** 37.5 → "37,5 h" (P15). Pendiente de implementar en T-03. */
export function formatearHoras(horas: number): string {
  throw new Error('no implementado');
}
