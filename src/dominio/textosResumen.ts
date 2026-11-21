import type { TipoObra } from '../types';

// Textos de la pantalla "Mi año en cine", exactos a DESIGN.md (sección 5, "Voz"), con los datos reales.

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/** Debajo de cada barra (D10). */
export const INICIALES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const;

const PLURAL = { obra: 'obras', película: 'películas', serie: 'series' } as const;

/** "1 obra", "7 obras", "1 película", "12 series". */
export function contar(n: number, palabra: keyof typeof PLURAL): string {
  return `${n} ${n === 1 ? palabra : PLURAL[palabra]}`;
}

/** "¡Viste 42 obras este año! Nada mal." o, para otro año, "¡Viste 12 obras en 2025! Nada mal." */
export function fraseResumen(total: number, anio: number, anioActual: number): string {
  return `¡Viste ${contar(total, 'obra')} ${anio === anioActual ? 'este año' : `en ${anio}`}! Nada mal.`;
}

/** Apoyo de "Obras vistas": "30 películas y 12 series". */
export const apoyoObrasVistas = (peliculas: number, series: number) =>
  `${contar(peliculas, 'película')} y ${contar(series, 'serie')}`;

/** Dato faltante de "Horas de cine" en la tarjeta compacta: "ⓘ 2 sin duración". */
export const sinDuracion = (peliculas: number) => `ⓘ ${peliculas} sin duración`;

const mes = (indice: number) => MESES[indice] ?? '';

/** "Octubre" (valor de la tarjeta "Mes top"). */
export const nombreMes = (indice: number) => {
  const nombre = mes(indice);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

/** "Pico: octubre". */
export const pico = (indice: number) => `Pico: ${mes(indice)}`;

/** Una sola etiqueta para toda la tarjeta de barras: "Obras vistas por mes: enero 2, …, diciembre 0". */
export const etiquetaBarras = (obrasPorMes: readonly number[]) =>
  `Obras vistas por mes: ${obrasPorMes.map((n, i) => `${mes(i)} ${n}`).join(', ')}`;

/** "Película · vista el 12 de octubre". `diaYMes` llega armado ("12 de octubre"): el dominio no lee fechas. */
export const fechaDestacada = (tipo: TipoObra, diaYMes: string) =>
  `${tipo === 'movie' ? 'Película' : 'Serie'} · vista el ${diaYMes}`;
