import { describe, expect, it } from 'vitest';
import type { CambiosItem } from '../types';
import { limpiarCambios, transicionVistaEn } from './reglasLista';

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

describe('transicionVistaEn', () => {
  it('CA-A.1.1 por ver o viendo a vista: poner', () => {
    expect(transicionVistaEn('por_ver', 'vista')).toBe('poner');
    expect(transicionVistaEn('viendo', 'vista')).toBe('poner');
  });

  it('CA-A.1.2 vista a viendo o por ver: quitar', () => {
    expect(transicionVistaEn('vista', 'viendo')).toBe('quitar');
    expect(transicionVistaEn('vista', 'por_ver')).toBe('quitar');
  });

  it('CA-A.1.3 de viendo otra vez a vista: poner', () => {
    expect(transicionVistaEn('vista', 'viendo')).toBe('quitar');
    expect(transicionVistaEn('viendo', 'vista')).toBe('poner');
  });

  it('CA-A.1.4 vista a vista con otra calificación o comentario: mantener', () => {
    // El estado no cambia aunque cambien la calificación o el comentario: la transición solo mira el estado.
    expect(transicionVistaEn('vista', 'vista')).toBe('mantener');
  });

  it('CA-A.1.5 guardar sin cambiar el estado: mantener', () => {
    expect(transicionVistaEn('vista', 'vista')).toBe('mantener');
    expect(transicionVistaEn('viendo', 'viendo')).toBe('mantener');
    expect(transicionVistaEn('por_ver', 'por_ver')).toBe('mantener');
  });
});
