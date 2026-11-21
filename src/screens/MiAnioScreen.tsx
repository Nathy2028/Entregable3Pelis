import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarrasPorMes, ObraDestacada, SelectorAnio, TarjetaDato } from '../components/resumen';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { formatearHoras } from '../dominio/resumenAnual';
import { apoyoObrasVistas, contar, fraseResumen, nombreMes, sinDuracion } from '../dominio/textosResumen';
import { useMiAnio } from '../hooks/useMiAnio';
import type { PropsPestana } from '../navigation';
import { espacio, MARGEN, type Tema } from '../tema';
import { anioActual } from '../utils/fechas';

/** "Mi año en cine" (DESIGN.md, sección 4). Los estados de carga, vacío, error y avisos llegan en T-10. */
export function MiAnioScreen(_props: PropsPestana<'MiAnio'>) {
  const insets = useSafeAreaInsets();
  const { texto } = useTema();
  const s = useEstilos(estilos);
  const { anio, cambiarAnio, anios, resumen: r } = useMiAnio();

  // Las barras crecen cada vez que se abre la pantalla y cada vez que cambia el año.
  const [aperturas, setAperturas] = useState(0);
  useFocusEffect(useCallback(() => setAperturas((n) => n + 1), []));

  const mesTop = r.mesTop;
  return (
    // El margen de la barra de estado va fuera del ScrollView: así el contenido no pasa por debajo de la hora.
    <View style={[s.pantalla, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.contenido}>
        <View>
          <Text style={texto.etiqueta}>Tu resumen</Text>
          <Text style={texto.display} accessibilityRole="header">
            Mi año en cine
          </Text>
          {r.totalObras > 0 ? (
            <Text style={[texto.cuerpo, s.frase]}>{fraseResumen(r.totalObras, anio, anioActual())}</Text>
          ) : null}
        </View>

        <SelectorAnio anios={anios} anio={anio} onCambiar={cambiarAnio} />

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

            {r.destacada && <ObraDestacada obra={r.destacada} />}
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
