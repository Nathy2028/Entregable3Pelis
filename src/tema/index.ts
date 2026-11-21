import { StyleSheet, type TextStyle } from 'react-native';
import { PALETA, PALETA_CONTRASTE, TIPOGRAFIA, type EstiloTexto, type Paleta } from './tokens';

export * from './tokens';

export type EscalaTexto = 1 | 1.15 | 1.3;

export interface Preferencias {
  escalaTexto: EscalaTexto;
  altoContraste: boolean;
  reducirMovimiento: boolean;
}

export const PREFERENCIAS_INICIALES: Preferencias = {
  escalaTexto: 1,
  altoContraste: false,
  reducirMovimiento: false,
};

/** Un estilo de TIPOGRAFIA con la paleta y la escala de texto activas. */
function estiloTexto(t: EstiloTexto, color: Paleta, f: number): TextStyle {
  return {
    color: color[t.color],
    fontSize: t.tamano * f,
    ...(t.peso && { fontWeight: t.peso }),
    ...(t.espaciado !== undefined && { letterSpacing: t.espaciado }),
    ...(t.linea !== undefined && { lineHeight: t.linea * f }),
    ...(t.mayusculas && { textTransform: 'uppercase' as const }),
    ...(t.tabular && { fontVariant: ['tabular-nums' as const] }),
  };
}

export function crearTema(p: Preferencias) {
  const color = p.altoContraste ? PALETA_CONTRASTE : PALETA;
  const f = p.escalaTexto;
  return {
    color,
    escala: f,
    transicion: p.reducirMovimiento ? 0 : 150, // ms para expo-image
    animado: !p.reducirMovimiento,
    texto: StyleSheet.create({
      dato: estiloTexto(TIPOGRAFIA.dato, color, f),
      display: estiloTexto(TIPOGRAFIA.display, color, f),
      titulo: estiloTexto(TIPOGRAFIA.titulo, color, f),
      subtitulo: estiloTexto(TIPOGRAFIA.subtitulo, color, f),
      cuerpo: estiloTexto(TIPOGRAFIA.cuerpo, color, f),
      pequeno: estiloTexto(TIPOGRAFIA.pequeno, color, f),
      etiqueta: estiloTexto(TIPOGRAFIA.etiqueta, color, f),
    }),
    // Colores de estado y de error (DESIGN.md): siempre los mismos pares de fondo y texto.
    estado: {
      vista: { fondo: color.acento, texto: color.sobreAcento },
      viendo: { fondo: color.acentoSuave, texto: color.acento },
      porVer: { fondo: color.superficieAlta, texto: color.textoSecundario, borde: color.borde },
      error: { fondo: color.peligroSuave, texto: color.peligro },
    },
  };
}

export type Tema = ReturnType<typeof crearTema>;
