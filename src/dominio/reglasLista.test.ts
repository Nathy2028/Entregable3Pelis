import { describe, expect, it } from 'vitest';
import type { CambiosItem } from '../types';
import { limpiarCambios } from './reglasLista';

function cambios(parciales: Partial<CambiosItem>): CambiosItem {
  return { estado: 'vista', calificacionPersonal: null, comentario: '', ...parciales };
}

describe('limpiarCambios (RF6)', () => {
  it('una obra vista con calificación 4 conserva el 4', () => {
    expect(limpiarCambios(cambios({ estado: 'vista', calificacionPersonal: 4 })).calificacionPersonal).toBe(
      4,
    );
  });

  it('por_ver con calificación 4 queda en null', () => {
    expect(
      limpiarCambios(cambios({ estado: 'por_ver', calificacionPersonal: 4 })).calificacionPersonal,
    ).toBeNull();
  });

  it('viendo con calificación 4 queda en null', () => {
    expect(
      limpiarCambios(cambios({ estado: 'viendo', calificacionPersonal: 4 })).calificacionPersonal,
    ).toBeNull();
  });

  it('vista con calificación null sigue en null', () => {
    expect(
      limpiarCambios(cambios({ estado: 'vista', calificacionPersonal: null })).calificacionPersonal,
    ).toBeNull();
  });

  it('un comentario de 600 caracteres queda en 500', () => {
    const largo = 'x'.repeat(600);
    const { comentario } = limpiarCambios(cambios({ comentario: largo }));
    expect(comentario).toHaveLength(500);
    expect(comentario).toBe(largo.slice(0, 500));
  });

  it('un comentario con espacios al inicio y al final queda sin ellos', () => {
    expect(limpiarCambios(cambios({ comentario: '  hola  ' })).comentario).toBe('hola');
  });

  it('conserva el estado tal cual', () => {
    expect(limpiarCambios(cambios({ estado: 'viendo' })).estado).toBe('viendo');
  });

  it('primero quita los espacios y después recorta a 500', () => {
    expect(limpiarCambios(cambios({ comentario: '   ' + 'a'.repeat(600) })).comentario).toBe('a'.repeat(500));
  });
});
