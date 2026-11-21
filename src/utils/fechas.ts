import type { Calendario } from '../dominio/resumenAnual';

// Los únicos lugares de la épica que leen la hora del sistema: el dominio la recibe como parámetro.

/** Año y mes (enero = 0) de un instante en la zona horaria del teléfono (P4). */
export const calendarioLocal: Calendario = (ms) => {
  const fecha = new Date(ms);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
};

/** El año del reloj del teléfono, sin corregirlo (P8). */
export const anioActual = (): number => new Date().getFullYear();
