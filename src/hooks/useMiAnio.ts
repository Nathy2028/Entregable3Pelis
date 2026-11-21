import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useCartelera } from '../context/CarteleraContext';
import { accionAnteFalloTmdb, obrasParaCompletar, obrasParaFechar } from '../dominio/migraciones';
import { aniosDisponibles, resumenAnual, type ResumenAnual } from '../dominio/resumenAnual';
import { SinConexionError } from '../services/firebase';
import { guardarDescartadas, leerDescartadas } from '../services/listaService';
import { obtenerDetalle, TmdbError } from '../services/tmdbService';
import { anioActual, calendarioLocal } from '../utils/fechas';

export interface ProgresoMiAnio {
  hechas: number;
  total: number;
}

export interface MiAnio {
  anio: number;
  cambiarAnio: (anio: number) => void;
  anios: number[];
  resumen: ResumenAnual;
  progreso: ProgresoMiAnio | null; // D6 en curso ("Completando 2 de 5")
  sinConexion: boolean;
  error: string | null;
  cargando: boolean; // trayendo la lista del servidor y corriendo D2
  reintentar: () => void;
}

/**
 * Resumen del año elegido (D3–D11). Al entrar a la pantalla y al cambiar de año, con conexión, migra primero las
 * fechas (D2) y después, de una en una, los datos de TMDB de las obras de ese año (D6). Sin conexión no escribe
 * nada y el resumen sale de la copia local (D13).
 */
export function useMiAnio(): MiAnio {
  const { usuario, lista, sinConexion, errorLista, recargar, fecharVistas, completarObra } = useCartelera();
  const uid = usuario?.uid ?? null;
  const [anio, setAnio] = useState(anioActual); // D4
  const [progreso, setProgreso] = useState<ProgresoMiAnio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorMigracion, setErrorMigracion] = useState<string | null>(null);
  // Cada corrida tiene un número: si cambia el año o se sale de la pantalla, la anterior deja de avanzar.
  const corrida = useRef(0);

  const anios = useMemo(() => aniosDisponibles(lista, anioActual(), calendarioLocal), [lista]);
  const resumen = useMemo(() => resumenAnual(lista, anio, calendarioLocal), [lista, anio]);

  const migrar = useCallback(
    async (id: number, anioElegido: number) => {
      const vigente = () => corrida.current === id;
      setCargando(true);
      setErrorMigracion(null);
      setProgreso(null);
      try {
        // Solo se migra sobre la lista real del servidor; sin red o con error no se escribe nada (D13).
        const items = await recargar();
        if (!vigente() || !items || !uid) return;

        // D2 siempre antes que D6 (P16).
        const cambios = obrasParaFechar(items);
        if (cambios.length > 0) await fecharVistas(cambios);
        if (!vigente()) return;
        const fechaNueva = new Map(cambios.map((c) => [c.itemId, c.vistaEn]));
        const fechadas = items.map((i) => {
          const vistaEn = fechaNueva.get(i.id);
          return vistaEn === undefined ? i : { ...i, vistaEn };
        });
        setCargando(false);

        // D6: de una en una, con progreso. Las que TMDB ya no tiene (404) no se vuelven a pedir (P7).
        const descartadas = await leerDescartadas(uid);
        const pendientes = obrasParaCompletar(fechadas, anioElegido, calendarioLocal, descartadas);
        if (pendientes.length > 0) setProgreso({ hechas: 0, total: pendientes.length });
        for (const [n, obra] of pendientes.entries()) {
          if (!vigente()) return;
          try {
            const detalle = await obtenerDetalle(obra.tipo, obra.tmdbId);
            if (!vigente()) return;
            await completarObra(obra.id, detalle.datos);
          } catch (error) {
            if (!(error instanceof TmdbError)) throw error; // sin conexión u otro error: se detiene
            if (accionAnteFalloTmdb(error.status) === 'descartar') {
              descartadas.add(obra.id);
              await guardarDescartadas(uid, descartadas);
            } // 'reintentar': se intenta en la próxima apertura
          }
          if (vigente()) setProgreso({ hechas: n + 1, total: pendientes.length });
        }
      } catch (error) {
        if (vigente() && !(error instanceof SinConexionError)) {
          setErrorMigracion('Vuelve a intentarlo en un momento.');
        }
      } finally {
        if (vigente()) {
          setCargando(false);
          setProgreso(null);
        }
      }
    },
    [uid, recargar, fecharVistas, completarObra],
  );

  /** Empieza una corrida nueva; la que estuviera en curso deja de avanzar. */
  const correr = useCallback(() => {
    corrida.current += 1;
    void migrar(corrida.current, anio);
  }, [migrar, anio]);

  useFocusEffect(
    useCallback(() => {
      correr();
      return () => {
        corrida.current += 1; // al salir de la pantalla la corrida en curso se detiene
      };
    }, [correr]),
  );

  return {
    anio,
    cambiarAnio: setAnio,
    anios,
    resumen,
    progreso,
    sinConexion,
    error: errorLista ?? errorMigracion,
    cargando,
    reintentar: correr,
  };
}
