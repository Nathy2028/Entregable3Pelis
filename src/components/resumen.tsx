import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { etiquetaBarras, fechaDestacada, INICIALES, pico } from '../dominio/textosResumen';
import { radio, type Tema } from '../tema';
import type { ItemLista } from '../types';
import { diaYMes } from '../utils/fechas';
import { Estrellas, Poster } from './obra';
import { Chip } from './ui';

// Componentes de "Mi año en cine" (DESIGN.md, sección 3, "Nuevos de la épica"). Solo tokens de src/tema/.

/** Tarjeta de dato: un dato grande por tarjeta. "Obras vistas" va normal; las filas de dos, compactas. */
export function TarjetaDato({
  rotulo,
  valor,
  tipo = 'numero',
  unidad,
  unidadLeida,
  apoyo,
  faltante,
  compacta = false,
  sinDatos = false,
}: {
  rotulo: string;
  valor: string;
  tipo?: 'numero' | 'texto';
  unidad?: string; // "h", junto al número
  unidadLeida?: string; // "horas", para el lector de pantalla
  apoyo?: string;
  faltante?: string; // "ⓘ 2 sin duración"
  compacta?: boolean;
  sinDatos?: boolean; // el valor de texto va en textoSecundario
}) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  const etiqueta = [
    rotulo,
    unidadLeida ? `${valor} ${unidadLeida}` : valor,
    apoyo,
    faltante?.replace('ⓘ ', ''),
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <View style={[s.tarjeta, compacta && s.compacta]} accessible accessibilityLabel={etiqueta}>
      <Text style={[texto.etiqueta, s.rotulo]}>{rotulo}</Text>
      {tipo === 'numero' ? (
        <View style={s.numeroFila}>
          <Text style={[texto.dato, compacta && s.datoCompacto]}>{valor}</Text>
          {unidad ? <Text style={s.unidad}>{unidad}</Text> : null}
        </View>
      ) : (
        <Text style={[s.valorTexto, compacta && s.valorTextoCompacto, sinDatos && s.valorSinDatos]}>
          {valor}
        </Text>
      )}
      {apoyo ? <Text style={[texto.pequeno, s.apoyo]}>{apoyo}</Text> : null}
      {faltante ? <Text style={s.faltante}>{faltante}</Text> : null}
    </View>
  );
}

const ALTO_BARRAS = 96; // dentro de la pantalla (DESIGN.md)
const ALTO_CIFRA = 18; // espacio para la cifra encima de la barra del mes top
const BARRA_MINIMA = 3;

/**
 * 12 barras hechas con View, también las de 0. Crecen en 300 ms cuando cambia `animarCon` (al abrir la pantalla o
 * cambiar de año); con "reducir movimiento" aparecen directamente en su alto. Una sola etiqueta con los 12 valores.
 */
export function BarrasPorMes({
  obrasPorMes,
  mesTop,
  animarCon,
}: {
  obrasPorMes: number[];
  mesTop: number | null;
  animarCon: string;
}) {
  const { texto, animado } = useTema();
  const s = useEstilos(estilos);
  // El valor animado se crea una sola vez; con useState se puede leer durante el render.
  const [progreso] = useState(() => new Animated.Value(animado ? 0 : 1));

  useEffect(() => {
    if (!animado) {
      progreso.setValue(1);
      return;
    }
    progreso.setValue(0);
    const animacion = Animated.timing(progreso, { toValue: 1, duration: 300, useNativeDriver: false });
    animacion.start();
    return () => animacion.stop();
  }, [animarCon, animado, progreso]);

  const maximo = Math.max(1, ...obrasPorMes);
  return (
    <View style={s.tarjetaBarras} accessible accessibilityLabel={etiquetaBarras(obrasPorMes)}>
      <View style={s.cabeceraBarras}>
        <Text style={s.tituloBarras}>Tu año mes a mes</Text>
        {mesTop !== null ? <Text style={texto.pequeno}>{pico(mesTop)}</Text> : null}
      </View>
      <View style={s.barras}>
        {obrasPorMes.map((n, mes) => {
          const top = mes === mesTop;
          const alto = Math.max(BARRA_MINIMA, (n / maximo) * (ALTO_BARRAS - ALTO_CIFRA));
          return (
            <View key={mes} style={s.columna}>
              {top ? <Text style={s.cifra}>{n}</Text> : null}
              <Animated.View
                style={[
                  s.barra,
                  top && s.barraTop,
                  { height: progreso.interpolate({ inputRange: [0, 1], outputRange: [0, alto] }) },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={s.iniciales}>
        {INICIALES.map((inicial, mes) => (
          <Text key={mes} style={[s.inicial, mes === mesTop && s.inicialTop]}>
            {inicial}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** La obra mejor calificada del año como "portada": póster, título (2 líneas como máximo), estrellas y fecha. */
export function ObraDestacada({ obra }: { obra: ItemLista }) {
  const { texto } = useTema();
  const s = useEstilos(estilos);
  const nota = obra.calificacionPersonal ?? 0;
  const fecha = obra.vistaEn !== null ? fechaDestacada(obra.tipo, diaYMes(obra.vistaEn)) : null;
  const etiqueta = [`Tu mejor calificada del año: ${obra.titulo}`, `${nota} de 5 estrellas`, fecha]
    .filter(Boolean)
    .join(', ');
  return (
    <View style={s.tarjetaDestacada} accessible accessibilityLabel={etiqueta}>
      <View style={s.portada}>
        <Poster path={obra.posterPath} tamano="w500" style={s.portadaImagen} />
        <View style={s.portadaVelo} />
        <Text style={s.tituloDestacada} numberOfLines={2}>
          {obra.titulo}
        </Text>
      </View>
      <View style={s.cuerpoDestacada}>
        <Text style={texto.etiqueta}>Tu mejor calificada del año</Text>
        <View style={s.estrellas}>
          <Estrellas valor={nota} tamano={18} />
        </View>
        {fecha ? <Text style={[texto.pequeno, s.fecha]}>{fecha}</Text> : null}
      </View>
    </View>
  );
}

/** Chips de años en una fila desplazable que, al abrir, se desplaza sola hasta el año activo. */
export function SelectorAnio({
  anios,
  anio,
  onCambiar,
}: {
  anios: number[];
  anio: number;
  onCambiar: (anio: number) => void;
}) {
  const { animado } = useTema();
  const s = useEstilos(estilos);
  const fila = useRef<ScrollView>(null);
  const posiciones = useRef(new Map<number, number>());

  const mostrar = (x: number) => fila.current?.scrollTo({ x: Math.max(0, x - 8), animated: animado });

  useEffect(() => {
    const x = posiciones.current.get(anio);
    if (x !== undefined) fila.current?.scrollTo({ x: Math.max(0, x - 8), animated: animado });
  }, [anio, animado]);

  return (
    <ScrollView
      ref={fila}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.selector}
      accessibilityLabel="Año del resumen"
    >
      {anios.map((a) => (
        <View
          key={a}
          onLayout={(e) => {
            posiciones.current.set(a, e.nativeEvent.layout.x);
            if (a === anio) mostrar(e.nativeEvent.layout.x);
          }}
        >
          <Chip texto={String(a)} activo={a === anio} onPress={() => onCambiar(a)} />
        </View>
      ))}
    </ScrollView>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    // Tarjeta de dato
    tarjeta: {
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
      borderRadius: radio.l,
      padding: 18,
    },
    compacta: { flex: 1, paddingVertical: 14, paddingHorizontal: 16 },
    rotulo: { marginBottom: 10 },
    numeroFila: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    datoCompacto: { fontSize: 40, lineHeight: 40 },
    unidad: { color: color.textoSecundario, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    valorTexto: {
      color: color.texto,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      lineHeight: 28.6,
    },
    valorTextoCompacto: { fontSize: 22, lineHeight: 24.2 },
    valorSinDatos: { color: color.textoSecundario },
    apoyo: { marginTop: 8 },
    faltante: { color: color.textoTenue, fontSize: 12, marginTop: 10 },

    // Barras por mes
    tarjetaBarras: {
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
      borderRadius: radio.l,
      padding: 18,
    },
    cabeceraBarras: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    tituloBarras: { color: color.texto, fontSize: 15, fontWeight: '600' },
    barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: ALTO_BARRAS },
    columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    barra: {
      width: '100%',
      backgroundColor: color.barraInactiva,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
    },
    barraTop: { backgroundColor: color.acento },
    cifra: { color: color.acento, fontSize: 11, fontWeight: '700', marginBottom: 4 },
    iniciales: { flexDirection: 'row', gap: 6, marginTop: 8 },
    inicial: { flex: 1, textAlign: 'center', color: color.textoTenue, fontSize: 11, fontWeight: '600' },
    inicialTop: { color: color.acento },

    // Obra destacada
    tarjetaDestacada: {
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
      borderRadius: radio.l,
      overflow: 'hidden',
    },
    portada: { height: 140, justifyContent: 'flex-end', padding: 16 },
    portadaImagen: { ...StyleSheet.absoluteFill, aspectRatio: undefined, borderRadius: 0 },
    portadaVelo: { ...StyleSheet.absoluteFill, top: '40%', backgroundColor: color.velo },
    tituloDestacada: { color: color.texto, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
    cuerpoDestacada: { paddingTop: 16, paddingHorizontal: 18, paddingBottom: 18 },
    estrellas: { marginTop: 8 },
    fecha: { marginTop: 6 },

    // Selector de año
    selector: { gap: 8 },
  });
