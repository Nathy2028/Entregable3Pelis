import { describe, expect, it } from 'vitest';
import {
  apoyoObrasVistas,
  contar,
  etiquetaBarras,
  fechaDestacada,
  fraseResumen,
  INICIALES,
  MESES,
  nombreMes,
  pico,
  sinDuracion,
} from './textosResumen';

// Los textos deben ser exactamente los de DESIGN.md, sección 5 ("Voz").
describe('textos de Mi año en cine', () => {
  it('CA-A.2.3 frase del resumen del año actual', () => {
    expect(fraseResumen(42, 2026, 2026)).toBe('¡Viste 42 obras este año! Nada mal.');
  });

  it('CA-A.2.3 frase del resumen de otro año', () => {
    expect(fraseResumen(12, 2025, 2026)).toBe('¡Viste 12 obras en 2025! Nada mal.');
  });

  it('CA-A.2.3 singulares', () => {
    expect(fraseResumen(1, 2026, 2026)).toBe('¡Viste 1 obra este año! Nada mal.');
    expect(apoyoObrasVistas(1, 2)).toBe('1 película y 2 series');
    expect(apoyoObrasVistas(30, 12)).toBe('30 películas y 12 series');
    expect(contar(1, 'obra')).toBe('1 obra');
    expect(contar(7, 'obra')).toBe('7 obras');
    expect(contar(1, 'película')).toBe('1 película');
    expect(contar(1, 'serie')).toBe('1 serie');
  });

  it('CA-A.2.12 película sin duración en la tarjeta compacta', () => {
    expect(sinDuracion(2)).toBe('ⓘ 2 sin duración');
  });

  it('CA-A.2.23 mes top y pico', () => {
    expect(nombreMes(9)).toBe('Octubre');
    expect(pico(9)).toBe('Pico: octubre');
  });

  it('CA-A.2.25 la etiqueta de las barras nombra los 12 meses con su valor', () => {
    const porMes = [2, 3, 4, 0, 0, 0, 0, 0, 0, 7, 0, 0];
    expect(etiquetaBarras(porMes)).toBe(
      'Obras vistas por mes: enero 2, febrero 3, marzo 4, abril 0, mayo 0, junio 0, julio 0, agosto 0, ' +
        'septiembre 0, octubre 7, noviembre 0, diciembre 0',
    );
    expect(MESES).toHaveLength(12);
    expect(INICIALES.join(' ')).toBe('E F M A M J J A S O N D');
  });

  it('CA-A.2.27 fecha de la obra destacada', () => {
    expect(fechaDestacada('movie', '12 de octubre')).toBe('Película · vista el 12 de octubre');
    expect(fechaDestacada('tv', '3 de marzo')).toBe('Serie · vista el 3 de marzo');
  });
});
