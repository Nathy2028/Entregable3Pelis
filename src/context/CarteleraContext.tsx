import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { limpiarCambios, transicionVistaEn } from '../dominio/reglasLista';
import { escucharSesion, type User } from '../services/authService';
import { SinConexionError } from '../services/firebase';
import * as listaService from '../services/listaService';
import { crearItemId, soloObra } from '../services/listaService';
import { escucharPerfil, guardarCachePerfil, leerCachePerfil } from '../services/perfilService';
import { obtenerDatosParaAgregar } from '../services/tmdbService';
import type { CambiosItem, DatosTmdb, ItemLista, Obra, Perfil } from '../types';

interface ValorCartelera {
  usuario: User | null;
  iniciando: boolean; // resolviendo la sesión guardada al abrir la app
  perfil: Perfil | null | undefined; // undefined = cargando; null = la cuenta no tiene perfil
  lista: ItemLista[];
  cargandoLista: boolean;
  sinConexion: boolean; // se muestra la copia de AsyncStorage
  errorLista: string | null; // la carga falló por otra causa que no es la red (H12)
  /** La lista que llegó del servidor, o null si no se pudo traer (sin red, otro error o cambió la cuenta). */
  recargar: () => Promise<ItemLista[] | null>;
  agregar: (obra: Obra) => Promise<void>;
  actualizar: (itemId: string, cambios: CambiosItem) => Promise<void>;
  eliminar: (itemId: string) => Promise<void>;
  fecharVistas: (cambios: { itemId: string; vistaEn: number }[]) => Promise<void>; // D2
  completarObra: (itemId: string, datos: DatosTmdb) => Promise<void>; // D6
}

const CarteleraContext = createContext<ValorCartelera | null>(null);

export function CarteleraProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [lista, setLista] = useState<ItemLista[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  // Refs para leer el valor más reciente dentro de acciones asíncronas.
  const listaRef = useRef<ItemLista[]>([]);
  const uidRef = useRef<string | null>(null);
  const agregandoRef = useRef(new Set<string>()); // ids que esperan los datos de TMDB
  const uid = usuario?.uid ?? null;

  // Al cambiar de cuenta se limpia el estado de la anterior durante el render (patrón recomendado por
  // React en lugar de hacerlo dentro de un efecto).
  const [uidAnterior, setUidAnterior] = useState(uid);
  if (uid !== uidAnterior) {
    setUidAnterior(uid);
    setPerfil(undefined);
    setLista([]);
    setSinConexion(false);
    setErrorLista(null);
  }

  useEffect(
    () =>
      escucharSesion((u) => {
        setUsuario(u);
        setIniciando(false);
      }),
    [],
  );

  /** Estado local + copia en AsyncStorage, siempre juntos. Ignora respuestas de un usuario anterior. */
  const fijarLista = useCallback((nueva: ItemLista[], deUid: string, cachear = true) => {
    if (uidRef.current !== deUid) return;
    listaRef.current = nueva;
    setLista(nueva);
    if (cachear) void listaService.guardarCacheLista(deUid, nueva);
  }, []);

  // Perfil: copia local primero y luego Firestore en tiempo real (las ediciones se ven al instante).
  useEffect(() => {
    if (!uid) return;
    let vigente = true;
    void leerCachePerfil(uid).then((copia) => {
      if (vigente && copia) setPerfil((actual) => actual ?? copia);
    });
    const dejarDeEscuchar = escucharPerfil(uid, (p) => {
      if (!vigente) return;
      setPerfil(p);
      if (p) void guardarCachePerfil(uid, p);
    });
    return () => {
      vigente = false;
      dejarDeEscuchar();
    };
  }, [uid]);

  const recargar = useCallback(async (): Promise<ItemLista[] | null> => {
    if (!uid) return null;
    setCargandoLista(true);
    try {
      const items = await listaService.obtener(uid);
      if (uidRef.current !== uid) return null; // la respuesta es de una cuenta anterior
      fijarLista(items, uid);
      setSinConexion(false);
      setErrorLista(null);
      return items;
    } catch (error) {
      // En los dos casos se mantiene la última copia y no se escribe nada.
      const sinRed = error instanceof SinConexionError; // también si la lista vino de la caché (P17, H1)
      setSinConexion(sinRed);
      setErrorLista(sinRed ? null : 'Vuelve a intentarlo en un momento.'); // H12
      return null;
    } finally {
      setCargandoLista(false);
    }
  }, [uid, fijarLista]);

  // Al iniciar sesión: primero la copia local (instantánea), después Firestore.
  useEffect(() => {
    uidRef.current = uid;
    listaRef.current = [];
    if (!uid) return;
    void (async () => {
      const copia = await listaService.leerCacheLista(uid);
      if (copia) fijarLista(copia, uid, false);
      await recargar();
    })();
  }, [uid, recargar, fijarLista]);

  /** Actualiza la UI al instante y luego escribe en Firestore; si falla (no por red), revierte. */
  const mutar = useCallback(
    async (nueva: ItemLista[], escribir: (uid: string) => Promise<void>) => {
      if (!uid) return;
      const anterior = listaRef.current;
      fijarLista(nueva, uid);
      try {
        await escribir(uid);
        setSinConexion(false);
      } catch (error) {
        // Sin red la escritura queda en cola en Firestore y se envía al reconectar.
        if (error instanceof SinConexionError) return setSinConexion(true);
        fijarLista(anterior, uid);
        throw error;
      }
    },
    [uid, fijarLista],
  );

  const agregar = useCallback(
    async (obra: Obra) => {
      const id = crearItemId(obra.tipo, obra.tmdbId);
      const enLista = () => listaRef.current.some((i) => i.id === id);
      // RF4: sin duplicados, tampoco con un segundo toque mientras se esperan los datos de TMDB.
      if (enLista() || agregandoRef.current.has(id)) return;
      agregandoRef.current.add(id);
      const deUid = uidRef.current;
      try {
        // A lo sumo 5 s; null si TMDB falla o tarda (P19): se agrega sin datos y D6 los completa después.
        const datos = await obtenerDatosParaAgregar(obra.tipo, obra.tmdbId);
        if (uidRef.current !== deUid || enLista()) return; // cambió la cuenta o ya se agregó mientras tanto
        const ahora = Date.now();
        const item: ItemLista = {
          ...soloObra(obra),
          id,
          estado: 'por_ver',
          calificacionPersonal: null,
          comentario: '',
          agregadoEn: ahora,
          actualizadoEn: ahora,
          vistaEn: null,
          generos: datos?.generos ?? null,
          duracionMin: datos?.duracionMin ?? null,
          directores: datos?.directores ?? null,
        };
        await mutar([item, ...listaRef.current], (u) => listaService.agregar(u, obra, datos));
      } finally {
        agregandoRef.current.delete(id);
      }
    },
    [mutar],
  );

  const actualizar = useCallback(
    async (itemId: string, cambios: CambiosItem) => {
      const limpios = limpiarCambios(cambios); // RF6
      const antes = listaRef.current.find((i) => i.id === itemId);
      const transicion = antes ? transicionVistaEn(antes.estado, limpios.estado) : 'mantener'; // D1
      const ahora = Date.now();
      // P11: la hora del teléfono hasta que la próxima carga traiga la del servidor.
      const vistaEn = (i: ItemLista) =>
        transicion === 'poner' ? ahora : transicion === 'quitar' ? null : i.vistaEn;
      const nueva = listaRef.current.map((i) =>
        i.id === itemId ? { ...i, ...limpios, actualizadoEn: ahora, vistaEn: vistaEn(i) } : i,
      );
      await mutar(nueva, (u) => listaService.actualizar(u, itemId, limpios, transicion));
    },
    [mutar],
  );

  const eliminar = useCallback(
    (itemId: string) =>
      mutar(
        listaRef.current.filter((i) => i.id !== itemId),
        (u) => listaService.eliminar(u, itemId),
      ),
    [mutar],
  );

  /** D2: pone vistaEn = actualizadoEn a las obras vistas sin fecha. Como toda escritura, cambia actualizadoEn (P10). */
  const fecharVistas = useCallback(
    async (cambios: { itemId: string; vistaEn: number }[]) => {
      if (cambios.length === 0) return;
      const porId = new Map(cambios.map((c) => [c.itemId, c.vistaEn]));
      const ahora = Date.now();
      const nueva = listaRef.current.map((i) => {
        const vistaEn = porId.get(i.id);
        return vistaEn === undefined ? i : { ...i, vistaEn, actualizadoEn: ahora };
      });
      await mutar(nueva, async (u) => {
        await Promise.all(cambios.map((c) => listaService.fecharVista(u, c.itemId, c.vistaEn)));
      });
    },
    [mutar],
  );

  /** D6: guarda los datos de TMDB de una obra que nunca se completó. */
  const completarObra = useCallback(
    async (itemId: string, datos: DatosTmdb) => {
      const ahora = Date.now();
      const nueva = listaRef.current.map((i) =>
        i.id === itemId
          ? {
              ...i,
              generos: datos.generos,
              duracionMin: datos.duracionMin,
              directores: datos.directores,
              actualizadoEn: ahora,
            }
          : i,
      );
      await mutar(nueva, (u) => listaService.completarDatos(u, itemId, datos));
    },
    [mutar],
  );

  const valor = useMemo(
    () => ({
      usuario,
      iniciando,
      perfil,
      lista,
      cargandoLista,
      sinConexion,
      errorLista,
      recargar,
      agregar,
      actualizar,
      eliminar,
      fecharVistas,
      completarObra,
    }),
    [
      usuario,
      iniciando,
      perfil,
      lista,
      cargandoLista,
      sinConexion,
      errorLista,
      recargar,
      agregar,
      actualizar,
      eliminar,
      fecharVistas,
      completarObra,
    ],
  );

  return <CarteleraContext value={valor}>{children}</CarteleraContext>;
}

export function useCartelera(): ValorCartelera {
  const valor = useContext(CarteleraContext);
  if (!valor) throw new Error('useCartelera debe usarse dentro de <CarteleraProvider>.');
  return valor;
}
