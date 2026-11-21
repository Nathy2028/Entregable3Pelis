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

/** Obra vista con fecha: la única que puede contar en un año. */
type ObraFechada = ItemLista & { vistaEn: number };

const fechada = (i: ItemLista): i is ObraFechada => i.estado === 'vista' && i.vistaEn !== null;

/** Orden alfabético en español, sin distinguir mayúsculas ni tildes (P2). */
const compararNombre = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

/** D3: obras vistas en `anio` según la hora local, cada una una sola vez (no hay revisionados). */
function delAnio(items: ItemLista[], anio: number, calendario: Calendario): ObraFechada[] {
  const porId = new Map<string, ObraFechada>();
  for (const i of items) {
    if (fechada(i) && calendario(i.vistaEn).anio === anio && !porId.has(i.id)) porId.set(i.id, i);
  }
  return [...porId.values()];
}

interface Conteo {
  obras: number;
  suma: number;
  calificadas: number;
}

/**
 * D8 y D9: cada obra suma 1 a cada uno de sus nombres. Gana el de más obras; en un empate, el de mayor promedio
 * exacto de calificación entre sus obras calificadas (sin calificadas pierde, P18); después, el orden alfabético.
 */
function masVisto(
  entradas: { nombres: string[]; calificacion: number | null }[],
): { nombre: string; obras: number } | null {
  const conteos = new Map<string, Conteo>();
  for (const { nombres, calificacion } of entradas) {
    for (const nombre of new Set(nombres)) {
      const c = conteos.get(nombre) ?? { obras: 0, suma: 0, calificadas: 0 };
      c.obras += 1;
      if (calificacion !== null) {
        c.suma += calificacion;
        c.calificadas += 1;
      }
      conteos.set(nombre, c);
    }
  }
  const promedio = (c: Conteo) => (c.calificadas > 0 ? c.suma / c.calificadas : -Infinity);
  const ordenados = [...conteos].sort(([nombreA, a], [nombreB, b]) => {
    if (a.obras !== b.obras) return b.obras - a.obras;
    // Se compara con < y > porque -Infinity - -Infinity da NaN.
    const pa = promedio(a);
    const pb = promedio(b);
    if (pa !== pb) return pa > pb ? -1 : 1;
    return compararNombre(nombreA, nombreB);
  });
  const primero = ordenados[0];
  return primero ? { nombre: primero[0], obras: primero[1].obras } : null;
}

/** D11: mayor calificación; empate → vistaEn más reciente; empate → título en orden alfabético (P1). */
function obraDestacada(obras: ObraFechada[]): ItemLista | null {
  const calificadas = obras.filter((o) => o.calificacionPersonal !== null);
  const ordenadas = calificadas.sort(
    (a, b) =>
      (b.calificacionPersonal ?? 0) - (a.calificacionPersonal ?? 0) ||
      b.vistaEn - a.vistaEn ||
      compararNombre(a.titulo, b.titulo),
  );
  return ordenadas[0] ?? null;
}

/** Resumen de las obras vistas en `anio` (D3–D11). */
export function resumenAnual(items: ItemLista[], anio: number, calendario: Calendario): ResumenAnual {
  const obras = delAnio(items, anio, calendario);
  const peliculas = obras.filter((o) => o.tipo === 'movie');
  const completadas = obras.filter((o) => o.generos !== null);

  // D7: solo películas; las que no tienen duración no suman.
  const minutos = peliculas.reduce((total, p) => total + (p.duracionMin ?? 0), 0);

  // D10: 12 meses, también los de 0; en un empate gana el más reciente.
  const obrasPorMes: number[] = Array.from({ length: 12 }, () => 0);
  for (const o of obras) obrasPorMes[calendario(o.vistaEn).mes] += 1;
  const maximo = Math.max(...obrasPorMes);
  const mesTop = maximo > 0 ? obrasPorMes.lastIndexOf(maximo) : null;

  return {
    anio,
    totalObras: obras.length,
    peliculas: peliculas.length,
    series: obras.length - peliculas.length,
    horas: Math.round((minutos / 60) * 10) / 10,
    peliculasSinDuracion: peliculas.filter((p) => p.generos !== null && p.duracionMin === null).length,
    obrasSinDatos: obras.length - completadas.length,
    generoTop: masVisto(
      completadas.map((o) => ({ nombres: o.generos ?? [], calificacion: o.calificacionPersonal })),
    ),
    directorTop: masVisto(
      completadas
        .filter((o) => o.tipo === 'movie')
        .map((o) => ({ nombres: o.directores ?? [], calificacion: o.calificacionPersonal })),
    ),
    obrasPorMes,
    mesTop,
    destacada: obraDestacada(obras),
    obrasSinFecha: items.filter((i) => i.estado === 'vista' && i.vistaEn === null).length,
  };
}

/** D4: años con al menos una obra vista, más el actual, del más reciente al más antiguo. */
export function aniosDisponibles(items: ItemLista[], anioActual: number, calendario: Calendario): number[] {
  const anios = new Set([anioActual, ...items.filter(fechada).map((i) => calendario(i.vistaEn).anio)]);
  return [...anios].sort((a, b) => b - a);
}

/** 37.5 → "37,5 h": un decimal y coma decimal (P15). Un entero va sin decimal ("40 h"). */
export function formatearHoras(horas: number): string {
  return `${String(Math.round(horas * 10) / 10).replace('.', ',')} h`;
}
