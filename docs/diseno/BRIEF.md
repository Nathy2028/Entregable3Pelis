# Brief de marca — Cinta · Mi año en cine

Fecha: 21 de noviembre de 2026 · Autora: (Nathalia Barriga) · Alimenta a: `docs/diseno/brand-board.html` → `DESIGN.md` → `src/tema/`

## 1. Para quién es

**Cinéfilos casuales**: personas que ven películas y series con frecuencia, que conocen apps como Letterboxd pero las sienten demasiado técnicas o en inglés, y que quieren algo más simple y en español para llevar su lista y recordar lo que vieron. No buscan escribir reseñas largas ni seguir a otros usuarios: la lista es privada y es suya.

## 2. Personalidad: tres adjetivos

| Adjetivo | Qué significa en la app | Qué NO es |
|---|---|---|
| **Íntima** | Es el diario de cine de una sola persona. Te habla de tú, como una amiga que también ve cine ("¡Viste 42 obras este año! Nada mal."). Nada se comparte por defecto. | Una red social, un ranking público |
| **Editorial** | Jerarquía clara como en una revista de cine: un dato grande por tarjeta, títulos con peso, mucho aire, una idea a la vez. | Un tablero lleno de gráficas pequeñas |
| **Enérgica** | El verde lima sobre negro da ritmo. Los números del resumen son protagonistas. Las transiciones son cortas y se pueden quitar. | Colores chillones por todas partes, animaciones largas |

## 3. Qué debe sentir el usuario al ver su resumen del año

**Orgullo.** Al abrir "Mi año en cine" la persona debe pensar *"mira todo lo que vi"*, como cuando ve sus estadísticas de fin de año en una app de música.

Cómo se logra:
- Los números (obras, horas) se muestran grandes, como titulares.
- La obra destacada se presenta como una "portada", con su póster y su calificación.
- Los textos celebran con calidez y sin exagerar: "Octubre fue tu mes: 7 obras".
- Un año vacío o incompleto no da culpa: invita a seguir ("Todavía no hay nada en 2025. ¿Empezamos?").

## 4. Qué se conserva de la app actual

- **Nombre y logotipo:** "Cinta" y el ícono de la "C" negra sobre cuadrado verde lima con punto central (`assets/logo.svg`).
- **Paleta base:** fondo casi negro `#0A0A0A`, superficies `#131313` / `#1B1B1B`, texto `#F4F4F1`, acento verde lima `#D4FF3A` y error `#FF7A6B`. Todos los textos actuales ya cumplen 4,5:1.
- **Tema de alto contraste**, tamaño de texto ajustable (1 / 1,15 / 1,3) y "reducir movimiento".
- **Fuente del sistema** e íconos Lucide.
- **Alto mínimo táctil de 44 px.**
- **Componentes del Proyecto 3:** tarjeta de obra, etiqueta de estado (vista = acento, viendo = acento suave, por ver = neutro), estrellas, botón primario/secundario/peligro, chips de filtro, aviso "Sin conexión".
- **Atribución de TMDB** visible y siempre menos prominente que la marca Cinta.

## 5. Qué se agrega con la épica

Tarjeta de dato, barras por mes (hechas con `View`, sin librerías de gráficas), tarjeta de obra destacada, selector de año y estados de pantalla (carga, vacío, error, sin conexión, datos faltantes, progreso "Completando 2 de 5").

## 6. Restricciones

Español · contraste mínimo 4,5:1 en todo texto · fuente del sistema · sin colores fijos fuera de `src/tema/` · funciona en Expo Go · accesible con TalkBack/VoiceOver.
