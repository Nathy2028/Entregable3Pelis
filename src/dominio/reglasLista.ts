import type { CambiosItem, EstadoVisionado } from '../types';

const MAX_COMENTARIO = 500;

/** RF6: solo se califica una obra vista; el comentario va sin espacios al borde y con tope de 500. */
export function limpiarCambios(cambios: CambiosItem): CambiosItem {
  return {
    estado: cambios.estado,
    calificacionPersonal: cambios.estado === 'vista' ? cambios.calificacionPersonal : null,
    comentario: cambios.comentario.trim().slice(0, MAX_COMENTARIO),
  };
}

/**
 * D1: qué hacer con vistaEn al guardar. Entrar a "vista" pone la fecha nueva, salir la quita, y guardar sin
 * cambiar el estado la conserva (P5). Entre "por ver" y "viendo" sigue en null.
 */
export function transicionVistaEn(
  antes: EstadoVisionado,
  despues: EstadoVisionado,
): 'poner' | 'quitar' | 'mantener' {
  if (antes === despues) return 'mantener';
  if (despues === 'vista') return 'poner';
  if (antes === 'vista') return 'quitar';
  return 'mantener';
}
