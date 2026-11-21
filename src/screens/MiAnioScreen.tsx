import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Aviso,
  BarraProgreso,
  BarrasPorMes,
  EstadoPantalla,
  IndicadorCarga,
  ObraDestacada,
  SelectorAnio,
  TarjetaDato,
} from '../components/resumen';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { formatearHoras } from '../dominio/resumenAnual';
import {
  apoyoObrasVistas,
  avisoDatosFaltantes,
  avisoSinFecha,
  contar,
  fraseResumen,
  nombreMes,
  sinDuracion,
} from '../dominio/textosResumen';
import { useMiAnio } from '../hooks/useMiAnio';
import type { PropsPestana } from '../navigation';
import { espacio, MARGEN, type Tema } from '../tema';
import { anioActual } from '../utils/fechas';

const SIN_CONEXION = 'Estás sin conexión. No pasa nada: te mostramos lo último que guardamos.';

/**
 * "Mi año en cine" (DESIGN.md, sección 4). Estados por prioridad: error, cargando, sin conexión y sin copia, año
 * vacío (D12) y resumen, con los avisos arriba (D13, D6, D7).
 */
export function MiAnioScreen({ navigation }: PropsPestana<'MiAnio'>) {
  const insets = useSafeAreaInsets();
  const { texto } = useTema();
  const s = useEstilos(estilos);
  const {
    anio,
    cambiarAnio,
    anios,
    resumen: r,
    progreso,
    sinConexion,
    listaVacia,
    error,
    cargando,
    reintentar,
  } = useMiAnio();

  // Las barras crecen cada vez que se abre la pantalla y cada vez que cambia el año.
  const [aperturas, setAperturas] = useState(0);
  useFocusEffect(useCallback(() => setAperturas((n) => n + 1), []));

  const cabecera = (
    <View>
      <Text style={texto.etiqueta}>Tu resumen</Text>
      <Text style={texto.display} accessibilityRole="header">
        Mi año en cine
      </Text>
      {r.totalObras > 0 && !error ? (
        <Text style={[texto.cuerpo, s.frase]}>{fraseResumen(r.totalObras, anio, anioActual())}</Text>
      ) : null}
    </View>
  );

  // 1. Error (H12): la lista no se pudo leer por otra causa que no es la red.
  // 2. Cargando: nunca se muestra "vacío" antes de que llegue la lista.
  // 3. Sin conexión y sin copia (P17): no se sabe si el año está vacío; basta el aviso.
  const estadoCompleto = error ? (
    <EstadoPantalla
      variante="error"
      icono="circle-alert"
      titulo="Uy, no pudimos cargar tu resumen"
      mensaje="Revisa tu conexión y lo intentamos otra vez."
      accion={{ titulo: 'Reintentar', onPress: reintentar }}
    />
  ) : cargando && r.totalObras === 0 ? (
    <EstadoPantalla
      indicador={<IndicadorCarga />}
      titulo="Armando tu año…"
      mensaje="Un momento y lo tienes."
    />
  ) : sinConexion && listaVacia ? (
    <Aviso icono="wifi-off" texto={SIN_CONEXION} />
  ) : null;

  if (estadoCompleto) {
    return (
      <View style={[s.pantalla, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={s.contenido}>
          {cabecera}
          {estadoCompleto}
        </ScrollView>
      </View>
    );
  }

  const mesTop = r.mesTop;
  return (
    // El margen de la barra de estado va fuera del ScrollView: así el contenido no pasa por debajo de la hora.
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.contenido}>
        {cabecera}

        {/* Avisos arriba del resumen; el resto se ve normal. */}
        {sinConexion && <Aviso icono="wifi-off" texto={SIN_CONEXION} />}
        {sinConexion && r.obrasSinFecha > 0 && (
          <Aviso icono="calendar-clock" texto={avisoSinFecha(r.obrasSinFecha)} />
        )}
        {progreso && <BarraProgreso hechas={progreso.hechas} total={progreso.total} />}
        {!progreso && r.obrasSinDatos > 0 && (
          <Aviso icono="info" texto={avisoDatosFaltantes(r.obrasSinDatos)} />
        )}

        <SelectorAnio anios={anios} anio={anio} onCambiar={cambiarAnio} />

        {r.totalObras === 0 && (
          <EstadoPantalla
            amplio
            icono="calendar"
            titulo={`Todavía no hay nada en ${anio}`}
            mensaje="¿Empezamos? Marca lo que veas y aquí aparecerá tu año."
            accion={{ titulo: 'Ir a Mi lista', onPress: () => navigation.navigate('MiLista') }}
          />
        )}

        {r.totalObras > 0 && (
          <>
            <TarjetaDato
              rotulo="Obras vistas"
              valor={String(r.totalObras)}
              apoyo={apoyoObrasVistas(r.peliculas, r.series)}
            />

            <View style={s.fila}>
              <TarjetaDato
                compacta
                rotulo="Horas de cine"
                valor={formatearHoras(r.horas).replace(/ h$/, '')}
                unidad="h"
                unidadLeida="horas"
                apoyo="Solo cuentan películas"
                faltante={r.peliculasSinDuracion > 0 ? sinDuracion(r.peliculasSinDuracion) : undefined}
              />
              {mesTop !== null && (
                <TarjetaDato
                  compacta
                  tipo="texto"
                  rotulo="Mes top"
                  valor={nombreMes(mesTop)}
                  apoyo={contar(r.obrasPorMes[mesTop] ?? 0, 'obra')}
                />
              )}
            </View>

            <View style={s.fila}>
              {r.generoTop ? (
                <TarjetaDato
                  compacta
                  tipo="texto"
                  rotulo="Género"
                  valor={r.generoTop.nombre}
                  apoyo={contar(r.generoTop.obras, 'obra')}
                />
              ) : (
                <TarjetaDato
                  compacta
                  sinDatos
                  tipo="texto"
                  rotulo="Género"
                  valor="Aún sin género favorito"
                  apoyo="No hay datos suficientes: a las obras de este año les faltan los géneros en TMDB."
                />
              )}
              {r.directorTop ? (
                <TarjetaDato
                  compacta
                  tipo="texto"
                  rotulo="Director"
                  valor={r.directorTop.nombre}
                  apoyo={contar(r.directorTop.obras, 'película')}
                />
              ) : (
                <TarjetaDato
                  compacta
                  sinDatos
                  tipo="texto"
                  rotulo="Director más visto"
                  valor="Aún sin director favorito"
                  apoyo="No hay datos suficientes: a las películas de este año les falta el director en TMDB."
                />
              )}
            </View>

            <BarrasPorMes obrasPorMes={r.obrasPorMes} mesTop={mesTop} animarCon={`${anio}-${aperturas}`} />

            {r.destacada ? (
              <ObraDestacada obra={r.destacada} />
            ) : (
              <EstadoPantalla
                rotulo="Tu mejor calificada"
                icono="star"
                titulo="Aún sin favorita"
                mensaje="Califica lo que viste y te contamos cuál fue tu favorita del año."
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: {
      paddingTop: espacio.s,
      paddingHorizontal: MARGEN,
      paddingBottom: espacio.margen,
      gap: espacio.m,
    },
    frase: { marginTop: 6 },
    fila: { flexDirection: 'row', gap: espacio.m },
  });
