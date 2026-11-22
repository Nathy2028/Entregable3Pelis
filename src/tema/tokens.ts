import type { TextStyle } from 'react-native';

// Tokens del brand board v3 (docs/diseno/brand-board.html), con los mismos nombres que DESIGN.md.
// Datos puros: este archivo no carga React Native, así los tests de Vitest lo leen directamente.

export const PALETA = {
  fondo: '#0A0A0A',
  superficie: '#131313',
  superficieAlta: '#1B1B1B',
  borde: '#262626',
  texto: '#F4F4F1',
  textoSecundario: '#A3A3A0', // 7.4:1 sobre superficie
  textoTenue: '#8A8A86', // 5.4:1 sobre superficie; también placeholder
  estrellaVacia: '#4A4A47', // no es texto
  acento: '#D4FF3A',
  sobreAcento: '#0A0A0A',
  acentoSuave: 'rgba(212, 255, 58, 0.12)',
  peligro: '#FF7A6B',
  peligroSuave: 'rgba(255, 122, 107, 0.12)', // fondo de avisos y estados de error
  velo: 'rgba(10, 10, 10, 0.62)', // fondo de controles sobre imágenes
  barraInactiva: '#3A3D2E', // barras de meses que no son el más activo (no es texto)
};

export type Paleta = typeof PALETA;

/** Alto contraste: textos secundarios casi blancos, bordes visibles y velos más oscuros. */
export const PALETA_CONTRASTE: Paleta = {
  ...PALETA,
  fondo: '#000000',
  superficie: '#0D0D0D',
  superficieAlta: '#1F1F1F',
  borde: '#6B6B66',
  textoSecundario: '#E6E6E2',
  textoTenue: '#CFCFCA',
  estrellaVacia: '#8A8A86',
  acentoSuave: 'rgba(212, 255, 58, 0.22)',
  peligro: '#FF9C90',
  peligroSuave: 'rgba(255, 156, 144, 0.16)',
  velo: 'rgba(0, 0, 0, 0.85)',
  barraInactiva: '#5A5E47',
};

/**
 * Transparencias y degradados que no son colores de la paleta (DESIGN.md, "Efectos"). Son iguales en alto contraste
 * y tienen los valores que ya usaba la app. Van fuera de PALETA: no están en el brand board.
 */
export const EFECTOS = {
  contornoAcento: 'rgba(212, 255, 58, 0.4)', // borde de la etiqueta "contorno" sobre pósters
  brilloAcento: '0px 8px 24px rgba(212, 255, 58, 0.22)', // sombra del botón primario
  degradado: {
    hero: (fondo: string) =>
      `linear-gradient(180deg, rgba(10, 10, 10, 0.5) 0%, rgba(10, 10, 10, 0.2) 45%, ${fondo} 100%)`,
    poster:
      'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0) 30%, rgba(10,10,10,0) 65%, rgba(10,10,10,0.8) 100%)',
    portada: 'linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.7) 100%)',
  },
};

/** esp-xs … esp-xxl. Entre tarjetas 12 (m), margen lateral 20 (margen), entre tocables 8 (s). */
export const espacio = { xs: 4, s: 8, m: 12, l: 16, margen: 20, xl: 24, xxl: 32 };

export const radio = { s: 10, m: 14, l: 20 };
export const MARGEN = espacio.margen; // margen lateral de todas las pantallas
export const TOQUE = 44; // alto mínimo de cualquier elemento tocable

export interface EstiloTexto {
  tamano: number;
  peso?: TextStyle['fontWeight']; // sin peso = 400
  espaciado?: number;
  linea?: number;
  color: keyof Paleta;
  mayusculas?: boolean;
  tabular?: boolean; // cifras del mismo ancho
}

/** Tamaños base (escala 1). La app los multiplica por la escala de texto, salvo el espaciado. */
export const TIPOGRAFIA = {
  dato: { tamano: 48, peso: '800', espaciado: -1.5, linea: 48, color: 'texto', tabular: true },
  display: { tamano: 32, peso: '800', espaciado: -0.8, color: 'texto' },
  titulo: { tamano: 22, peso: '700', espaciado: -0.3, color: 'texto' },
  subtitulo: { tamano: 16, peso: '600', color: 'texto' },
  cuerpo: { tamano: 15, linea: 22, color: 'textoSecundario' },
  pequeno: { tamano: 13, linea: 18, color: 'textoSecundario' },
  etiqueta: { tamano: 11, peso: '700', espaciado: 1.1, color: 'acento', mayusculas: true },
} satisfies Record<string, EstiloTexto>;
