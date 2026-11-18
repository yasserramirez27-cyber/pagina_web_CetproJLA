/**
 * ================================================================
 * CETPRO JOAQUÍN LÓPEZ ANTAY — JavaScript Principal
 * main.js | Versión 1.1 — datos servidos desde el panel del administrador
 * Vanilla JS puro (ES6+) — Sin librerías externas
 * ================================================================
 */

'use strict';

/* ════════════════════════════════════════════════════════════════
   ⚠️ CONFIGURACIÓN — valores de respaldo; los reales se editan en
      el panel del administrador → Configuración
   ════════════════════════════════════════════════════════════════ */
/* Datos que el servidor inserta desde la BD (panel del administrador).
   Viajan en <script id="datos-sitio" type="application/json">. */
const DATOS_SITIO = (() => {
  try { return JSON.parse(document.getElementById('datos-sitio')?.textContent || '{}'); }
  catch { return {}; }
})();
DATOS_SITIO.galeria = Array.isArray(DATOS_SITIO.galeria) ? DATOS_SITIO.galeria : [];

const CONFIG = {
  // Número de WhatsApp con código de país, sin "+" ni espacios (ej.: 51987654321)
  whatsapp: '51900000000',
  facebook: 'https://www.facebook.com/joaquin.lopezantay',
  youtube:  'https://www.youtube.com/channel/UCECSHifrlczh9HVelccs7hQ',
  // ID del video destacado: lo que va después de "v=" en el enlace de YouTube.
  // Vacío = el contenedor de video permanece oculto.
  youtubeVideo: '',
  // Las fotos de las carreras se suben desde el panel (Especialidades y Galería).
  // Testimonios autorizados: { nombre, carrera, texto, foto: 'img/egresados/nombre.jpg' }.
  testimonios: [],
};

// Los valores del panel (Configuración) reemplazan a los de arriba
Object.entries(DATOS_SITIO.config || {}).forEach(([clave, valor]) => {
  if (typeof valor === 'string') CONFIG[clave] = valor;
});

const enlaceWhatsApp = (texto) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;

/* ────────────────────────────────────────────────────────────────
   MÓDULO 1: MENÚ HAMBURGUESA
   Controla la apertura/cierre del menú en dispositivos móviles.
   Gestiona: animación de la X, panel deslizante, overlay y
   accesibilidad (aria-expanded, aria-label, focus trap).
   ──────────────────────────────────────────────────────────────── */
const MenuHamburguesa = (() => {

  // ── Referencias al DOM ──
  const btnHamburguesa = document.getElementById('hamburger-btn');
  const navPrincipal   = document.getElementById('main-nav');
  const overlay        = document.getElementById('nav-overlay');
  const header         = document.getElementById('header');

  // ── Estado ──
  let estaAbierto = false;

  /**
   * Abre el menú móvil.
   * - Agrega clases CSS para las animaciones.
   * - Actualiza atributos aria para accesibilidad.
   * - Bloquea el scroll del body.
   */
  const abrirMenu = () => {
    estaAbierto = true;

    // Animaciones CSS
    btnHamburguesa.classList.add('hamburger--open');
    navPrincipal.classList.add('nav--open');

    // Mostrar overlay con pequeño retraso para la transición
    overlay.style.display = 'block';
    // Forzar reflow para que la transición CSS funcione
    overlay.getBoundingClientRect();
    overlay.classList.add('nav-overlay--visible');

    // Accesibilidad
    btnHamburguesa.setAttribute('aria-expanded', 'true');
    btnHamburguesa.setAttribute('aria-label', 'Cerrar menú de navegación');
    navPrincipal.removeAttribute('aria-hidden');

    // Bloquear scroll del documento mientras el menú está abierto
    document.body.style.overflow = 'hidden';
  };

  /**
   * Cierra el menú móvil.
   * - Elimina clases de animación.
   * - Restaura atributos aria.
   * - Desbloquea el scroll del body.
   */
  const cerrarMenu = () => {
    estaAbierto = false;

    // Revertir animaciones CSS
    btnHamburguesa.classList.remove('hamburger--open');
    navPrincipal.classList.remove('nav--open');

    // Ocultar overlay (esperar a que termine la transición)
    overlay.classList.remove('nav-overlay--visible');
    setTimeout(() => {
      if (!estaAbierto) {
        overlay.style.display = 'none';
      }
    }, 280); // Coincidir con --transition-slow en CSS

    // Accesibilidad
    btnHamburguesa.setAttribute('aria-expanded', 'false');
    btnHamburguesa.setAttribute('aria-label', 'Abrir menú de navegación');
    navPrincipal.setAttribute('aria-hidden', 'true');

    // Restaurar scroll del documento
    document.body.style.overflow = '';
  };

  /**
   * Alterna el estado del menú.
   */
  const toggleMenu = () => {
    if (estaAbierto) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  };

  /**
   * Inicializa los event listeners del menú hamburguesa.
   */
  const init = () => {
    if (!btnHamburguesa || !navPrincipal || !overlay) return;

    // Click en el botón hamburguesa
    btnHamburguesa.addEventListener('click', toggleMenu);

    // Click en el overlay cierra el menú
    overlay.addEventListener('click', cerrarMenu);

    // Click en un enlace del menú cierra el panel (móvil)
    const enlacesNav = navPrincipal.querySelectorAll('.nav__link, .btn--cta');
    enlacesNav.forEach(enlace => {
      enlace.addEventListener('click', () => {
        // Solo cerrar si estamos en móvil (menú panel activo)
        if (window.innerWidth < 1024) {
          cerrarMenu();
        }
      });
    });

    // Tecla ESC cierra el menú
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && estaAbierto) {
        cerrarMenu();
        btnHamburguesa.focus(); // Retornar foco al botón (accesibilidad)
      }
    });

    // Al redimensionar a desktop: cerrar el menú y limpiar estado
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && estaAbierto) {
        cerrarMenu();
      }
    });
  };

  // API pública del módulo
  return { init, cerrarMenu, abrirMenu };

})();


/* ────────────────────────────────────────────────────────────────
   MÓDULO 2: HEADER SCROLL EFFECT
   Detecta el scroll de la página y agrega la clase .header--scrolled
   para cambiar el fondo del header a oscuro/translúcido.
   ──────────────────────────────────────────────────────────────── */
const HeaderScroll = (() => {

  const header = document.getElementById('header');
  const SCROLL_UMBRAL = 60; // píxeles de scroll para activar el cambio

  /**
   * Actualiza el estado del header según la posición del scroll.
   * Se llama usando requestAnimationFrame para optimizar performance.
   */
  const actualizarHeader = () => {
    const scrollActual = window.scrollY || window.pageYOffset;

    if (scrollActual > SCROLL_UMBRAL) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  };

  /**
   * Inicializa el observer de scroll con throttling via rAF.
   * requestAnimationFrame garantiza máximo 60fps sin bloquear el hilo.
   */
  const init = () => {
    if (!header) return;

    let rafId = null;

    const onScroll = () => {
      if (rafId) return; // Throttle: ignorar si ya hay un rAF pendiente
      rafId = requestAnimationFrame(() => {
        actualizarHeader();
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Ejecutar al cargar por si ya está en medio de la página (F5)
    actualizarHeader();
  };

  return { init };

})();


/* ────────────────────────────────────────────────────────────────
   MÓDULO 3: NAVEGACIÓN ACTIVA (ScrollSpy)
   Detecta qué sección está en el viewport y marca el enlace
   del menú correspondiente como activo (.nav__link--active).
   ──────────────────────────────────────────────────────────────── */
const ScrollSpy = (() => {

  const OFFSET = 100; // margen superior en píxeles (altura del header)

  /**
   * Actualiza el enlace activo según la sección visible.
   */
  const actualizarEnlaceActivo = () => {
    const secciones = document.querySelectorAll('section[id]');
    const enlacesNav = document.querySelectorAll('.nav__link');

    let seccionActiva = null;
    const scrollY = window.scrollY + OFFSET;

    // Encontrar la sección cuyo top es menor al scroll actual
    secciones.forEach(seccion => {
      if (seccion.offsetTop <= scrollY) {
        seccionActiva = seccion.id;
      }
    });

    // Actualizar clases en los enlaces
    enlacesNav.forEach(enlace => {
      enlace.classList.remove('nav__link--active');
      enlace.removeAttribute('aria-current');

      if (enlace.getAttribute('href') === `#${seccionActiva}`) {
        enlace.classList.add('nav__link--active');
        enlace.setAttribute('aria-current', 'page');
      }
    });
  };

  const init = () => {
    let rafId = null;

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        actualizarEnlaceActivo();
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    actualizarEnlaceActivo(); // Ejecutar al cargar
  };

  return { init };

})();


/* ────────────────────────────────────────────────────────────────
   MÓDULO 4: SCROLL SUAVE PARA ANCLAJES (accesibilidad mejorada)
   Asegura scroll suave en navegadores que no soporten CSS
   scroll-behavior, con compensación del header fijo.
   ──────────────────────────────────────────────────────────────── */
const SmoothScroll = (() => {

  const init = () => {
    // Seleccionar todos los enlaces internos (#)
    const enlacesInternos = document.querySelectorAll('a[href^="#"]');

    enlacesInternos.forEach(enlace => {
      enlace.addEventListener('click', (evento) => {
        const href = enlace.getAttribute('href');
        if (!href || href === '#') return;

        const destino = document.querySelector(href);
        if (!destino) return;

        evento.preventDefault();

        const headerHeight = document.getElementById('header')?.offsetHeight || 72;
        const posicionDestino = destino.getBoundingClientRect().top
                                + window.scrollY
                                - headerHeight
                                - 8; // 8px de margen extra

        window.scrollTo({
          top: posicionDestino,
          behavior: 'smooth'
        });
      });
    });
  };

  return { init };

})();


/* ────────────────────────────────────────────────────────────────
   MÓDULO 5: ANIMACIÓN DE ENTRADA DEL HEADER
   Al cargar la página, el header entra con una animación sutil
   deslizándose desde arriba.
   ──────────────────────────────────────────────────────────────── */
const HeaderEntrada = (() => {

  const init = () => {
    const header = document.getElementById('header');
    if (!header) return;

    // Aplicar estado inicial (invisible, arriba)
    header.style.transition = 'none';
    header.style.transform = 'translateY(-100%)';
    header.style.opacity = '0';

    // Forzar reflow
    header.getBoundingClientRect();

    // Iniciar animación en el siguiente frame
    requestAnimationFrame(() => {
      header.style.transition = 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms ease';
      header.style.transform = 'translateY(0)';
      header.style.opacity = '1';

      // Limpiar estilos inline al terminar (dejar que CSS tome control)
      setTimeout(() => {
        header.style.transition = '';
        header.style.transform = '';
        header.style.opacity = '';
      }, 650);
    });
  };

  return { init };

})();


/* ════════════════════════════════════════════════════════════════
   INICIALIZACIÓN PRINCIPAL
   DOMContentLoaded garantiza que el DOM está listo antes de
   ejecutar cualquier módulo.
   ════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Verificar soporte de preferencia de movimiento reducido
  const prefiereMenosMovimiento = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Inicializar módulos — Paso 1
  MenuHamburguesa.init();
  HeaderScroll.init();
  ScrollSpy.init();
  SmoothScroll.init();

  // Solo animar la entrada si el usuario no prefiere menos movimiento
  if (!prefiereMenosMovimiento) {
    HeaderEntrada.init();
  }

  // Inicializar módulos — Paso 2: Carreras
  TabsFiltros.init();
  ModalCarreras.init();

  // Inicializar módulos — Paso 3: Inscripción y Footer
  AcordeonFAQ.init();
  FormularioInscripcion.init();

  // Inicializar módulos — Paso 4: Hero, fotos y redes

  FotosCarreras.init();
  Redes.init();

  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

});


/* ════════════════════════════════════════════════════════════════
   PASO 2: MÓDULOS DE CARRERAS
   ════════════════════════════════════════════════════════════════ */


/* ────────────────────────────────────────────────────────────────
   MÓDULO 6: BASE DE DATOS DE CARRERAS
   Catálogo estático con toda la información de cada programa.
   Se consume desde ModalCarreras para poblar el modal dinámico.
   ──────────────────────────────────────────────────────────────── */
// Viene del módulo Especialidades del panel; el catálogo de abajo es solo respaldo.
const CARRERAS_DATA = DATOS_SITIO.especialidades || {

  gastronomia: {
    nombre:      'Servicio Básico Gastronómico',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#B84E0C',
    colorSoft:   'rgba(184,78,12,0.10)',
    descripcion: 'Aprenderás técnicas profesionales de preparación de alimentos, gestión de cocina, manipulación higiénica de alimentos y atención al cliente en establecimientos gastronómicos. Perfecto para emprender tu propio negocio o trabajar en restaurantes y hoteles.',
    requisitos: [
      'Certificado de estudios primarios o secundarios',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud (se tramita en el CESAMICA)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  panaderia: {
    nombre:      'Panadería',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#9A6A00',
    colorSoft:   'rgba(154,106,0,0.10)',
    descripcion: 'Domina técnicas de panadería artesanal e industrial, pastelería básica y producción de panes tradicionales ayacuchanos y modernos. Desarrolla las habilidades para abrir tu propia panadería o trabajar en la industria alimentaria.',
    requisitos: [
      'Certificado de estudios primarios completos',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud actualizado',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  adultomayor: {
    nombre:      'Cuidado del Adulto Mayor',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#C0262D',
    colorSoft:   'rgba(192,38,45,0.10)',
    descripcion: 'Adquiere las competencias para brindar cuidados básicos de salud, asistencia personal, movilización segura y actividades de bienestar y recreación para adultos mayores. Carrera con alta demanda en hogares, centros de reposo y servicios de salud.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud y de buena conducta',
      'Tener entre 18 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)'],
  },

  casas: {
    nombre:      'Mantenimiento de Casas',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#0A6C9E',
    colorSoft:   'rgba(10,108,158,0.10)',
    descripcion: 'Aprende plomería básica, instalaciones eléctricas domiciliarias seguras, pintura de interiores y exteriores, y carpintería básica. Una formación práctica para trabajar de forma independiente o en empresas de construcción y mantenimiento.',
    requisitos: [
      'Certificado de estudios primarios',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  estilismo: {
    nombre:      'Estilismo',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#1A7F26',
    colorSoft:   'rgba(26,127,38,0.10)',
    descripcion: 'Formación completa en corte de cabello, peinados, coloración, tratamientos capilares, manicura y pedicura para damas y caballeros. Al egresar tendrás las herramientas para abrir tu propio salón de belleza o trabajar en centros estéticos reconocidos.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud actualizado',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  electronico: {
    nombre:      'Mantenimiento Electrónico',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#0A5F8C',
    colorSoft:   'rgba(10,95,140,0.10)',
    descripcion: 'Aprende a diagnosticar y reparar equipos electrónicos: televisores, equipos de sonido, celulares y electrodomésticos. Incluye soldadura, lectura de circuitos y gestión de taller. Alta demanda laboral en Ayacucho y a nivel nacional.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  confeccion: {
    nombre:      'Confección de Prendas',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#B84E0C',
    colorSoft:   'rgba(184,78,12,0.10)',
    descripcion: 'Diseña, traza, corta y confecciona prendas de vestir utilizando máquinas industriales de coser y overlook. Aprende patronaje, transformaciones y escalado. Ideal para emprender tu propio taller o insertarte en la industria textil local.',
    requisitos: [
      'Certificado de estudios primarios completos',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  soporte: {
    nombre:      'Soporte Técnico',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#0A6C9E',
    colorSoft:   'rgba(10,108,158,0.10)',
    descripcion: 'Formación en mantenimiento preventivo y correctivo de computadoras, instalación de sistemas operativos y software, configuración de redes básicas y soporte a usuarios. Una de las carreras con mayor empleabilidad en el sector público y privado.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Conocimientos básicos de computadora (deseable)',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

  administrativo: {
    nombre:      'Apoyo Administrativo',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#1A7F26',
    colorSoft:   'rgba(26,127,38,0.10)',
    descripcion: 'Capacitación en contabilidad básica, gestión y organización documental, digitación avanzada, atención al cliente y manejo de software de oficina (Word, Excel). Indispensable en toda empresa, municipalidad u oficina pública de Ayacucho.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
  },

};


/* ────────────────────────────────────────────────────────────────
   MÓDULO 7: TABS / FILTROS DINÁMICOS
   Filtra las tarjetas de carrera según la pestaña seleccionada.
   Gestiona: estado activo de tabs, visibilidad de cards, contador
   de resultados y mensaje de sin resultados.
   ──────────────────────────────────────────────────────────────── */
const TabsFiltros = (() => {

  // ── Referencias al DOM ──
  const tabs       = document.querySelectorAll('.tab[data-filter]');
  const tarjetas   = document.querySelectorAll('.card[data-category]');
  const contVis    = document.getElementById('visible-count');
  const msgVacio   = document.getElementById('carreras-empty');

  /**
   * Aplica el filtro dado al grid de tarjetas.
   * @param {string} filtro - 'todos' | 'auxiliar' | 'tecnico' | 'basico'
   */
  const aplicarFiltro = (filtro) => {
    let visibles = 0;

    tarjetas.forEach(tarjeta => {
      const categoria = tarjeta.getAttribute('data-category');
      const mostrar   = filtro === 'todos' || categoria === filtro;

      if (mostrar) {
        tarjeta.classList.remove('card--hidden');
        visibles++;
      } else {
        tarjeta.classList.add('card--hidden');
      }
    });

    // Actualizar contador
    if (contVis) contVis.textContent = visibles;

    // Mostrar/ocultar mensaje de sin resultados
    if (msgVacio) {
      msgVacio.hidden = visibles > 0;
    }
  };

  /**
   * Actualiza el estado visual (active) de los botones tab.
   * @param {HTMLElement} tabActivo - El botón que fue clickeado.
   */
  const actualizarTabActivo = (tabActivo) => {
    tabs.forEach(tab => {
      const estaActivo = tab === tabActivo;
      tab.classList.toggle('tab--active', estaActivo);
      tab.setAttribute('aria-selected', estaActivo.toString());
    });
  };

  /**
   * Manejador de click en un tab.
   * @param {Event} evento
   */
  const manejarClick = (evento) => {
    const tab    = evento.currentTarget;
    const filtro = tab.getAttribute('data-filter');

    actualizarTabActivo(tab);
    aplicarFiltro(filtro);
  };

  /**
   * Permite navegar entre tabs con las teclas ← y → (accesibilidad ARIA).
   * @param {KeyboardEvent} evento
   */
  const manejarTeclado = (evento) => {
    const listaTabsArr = Array.from(tabs);
    const indiceActual = listaTabsArr.indexOf(document.activeElement);

    let indiceSiguiente = indiceActual;

    if (evento.key === 'ArrowRight') {
      indiceSiguiente = (indiceActual + 1) % listaTabsArr.length;
    } else if (evento.key === 'ArrowLeft') {
      indiceSiguiente = (indiceActual - 1 + listaTabsArr.length) % listaTabsArr.length;
    } else {
      return; // Ignorar otras teclas
    }

    evento.preventDefault();
    listaTabsArr[indiceSiguiente].focus();
    listaTabsArr[indiceSiguiente].click();
  };

  const init = () => {
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', manejarClick);
      tab.addEventListener('keydown', manejarTeclado);
    });

    // Estado inicial: mostrar todos
    aplicarFiltro('todos');
  };

  return { init };

})();


/* ────────────────────────────────────────────────────────────────
   MÓDULO 8: MODAL DE CARRERA
   Abre una ventana emergente con los detalles de la carrera
   seleccionada. Puebla el contenido dinámicamente desde
   CARRERAS_DATA. Gestiona: apertura, cierre, ESC, click fuera,
   trap de foco y actualización de colores dinámicos.
   ──────────────────────────────────────────────────────────────── */
const ModalCarreras = (() => {

  // ── Referencias al DOM ──
  const overlay      = document.getElementById('modal-overlay');
  const modal        = document.getElementById('modal');
  const btnCerrar    = document.getElementById('modal-close-btn');
  const btnCerrarGh  = document.getElementById('modal-cerrar-ghost-btn');
  const btnCta       = document.getElementById('modal-cta-btn');

  // Elementos de contenido del modal
  const elColorBar   = document.getElementById('modal-color-bar');
  const elIconWrap   = document.getElementById('modal-icon-wrap');
  const elCicloBadge = document.getElementById('modal-ciclo-badge');
  const elTitulo     = document.getElementById('modal-carrera-titulo');
  const elDuracion   = document.getElementById('modal-duracion');
  const elDesc       = document.getElementById('modal-descripcion');
  const elRequisitos = document.getElementById('modal-requisitos');
  const elTurnos     = document.getElementById('modal-turnos');
  const elGaleria    = document.getElementById('modal-galeria');

  // Estado
  let estaAbierto = false;
  let carreraActual = null;
  let ultimoEnfocado = null; // Para restaurar el foco al cerrar

  /**
   * Puebla el modal con los datos de la carrera.
   * @param {string} idCarrera - Clave en CARRERAS_DATA
   */
  const poblarModal = (idCarrera) => {
    const datos = CARRERAS_DATA[idCarrera];
    if (!datos) return false;

    // ── Barra de color dinámica ──
    if (elColorBar) {
      elColorBar.style.background =
        `linear-gradient(90deg, ${datos.color}, ${datos.color}99)`;
    }

    // ── Ícono (clonar el SVG de la tarjeta correspondiente) ──
    if (elIconWrap) {
      const tarjeta = document.querySelector(
        `.card[data-carrera="${idCarrera}"] .card__icon`
      );
      if (tarjeta) {
        elIconWrap.innerHTML = tarjeta.innerHTML;
        elIconWrap.style.background = datos.colorSoft;
        elIconWrap.style.border = `2px solid ${datos.color}`;
      }
    }

    // ── Badge de ciclo ──
    if (elCicloBadge) {
      elCicloBadge.textContent = datos.ciclo;
      const esTecnico = datos.ciclo.includes('Técnico') && !datos.ciclo.includes('Auxiliar');
      elCicloBadge.style.background = esTecnico
        ? 'rgba(29,78,216,0.10)'
        : `${datos.color}15`;
      elCicloBadge.style.color = esTecnico ? '#0A5F8C' : datos.color;
    }

    // ── Título, duración, descripción ──
    if (elTitulo)   elTitulo.textContent   = datos.nombre;
    if (elDuracion) elDuracion.textContent  = `📅 ${datos.duracion}`;
    if (elDesc)     elDesc.textContent      = datos.descripcion;

    // ── Módulos formativos (RD N.° 02617-2026-UGEL-HGA) ──
    const secModulos = document.getElementById('modal-modulos-section');
    const elModulos  = document.getElementById('modal-modulos');
    const elFamilia  = document.getElementById('modal-familia');
    const modulos    = Array.isArray(datos.modulos) ? datos.modulos : [];
    if (secModulos && elModulos) {
      secModulos.hidden = !modulos.length;
      if (elFamilia) {
        elFamilia.textContent = datos.familia ? `Familia productiva: ${datos.familia}` : '';
        elFamilia.hidden = !datos.familia;
      }
      elModulos.replaceChildren(...modulos.map(m => {
        const li = document.createElement('li');
        const nombre = document.createElement('span');
        nombre.className = 'modal__modulo-nombre';
        nombre.textContent = m.nombre;
        const meta = document.createElement('span');
        meta.className = 'modal__modulo-meta';
        meta.textContent = [
          m.horas && `${m.horas} h`,
          m.horas_practica && `${m.horas_practica} h de práctica`,
          m.creditos && `${m.creditos} créditos`,
        ].filter(Boolean).join(' · ');
        li.append(nombre, meta);
        return li;
      }));
    }

    // ── Lista de requisitos ──
    // (textContent: los textos vienen del panel y nunca se interpretan como HTML)
    if (elRequisitos) {
      elRequisitos.replaceChildren(...datos.requisitos.map(req => {
        const li = document.createElement('li');
        li.textContent = req;
        return li;
      }));
    }

    // ── Chips de turnos ──
    if (elTurnos) {
      elTurnos.replaceChildren(...datos.turnos.map(turno => {
        const chip = document.createElement('span');
        chip.className = 'turno-chip';
        chip.textContent = `🕐 ${turno}`;
        return chip;
      }));
    }

    // ── Galería de fotos del taller ──
    if (elGaleria) {
      document.getElementById('modal-fotos-section').hidden = true;
      elGaleria.replaceChildren(...FotosCarreras.galeria(idCarrera, datos.nombre));
    }

    carreraActual = idCarrera;
    return true;
  };

  /**
   * Abre el modal para una carrera específica.
   * @param {string} idCarrera
   * @param {HTMLElement} elementoOrigen - Botón que disparó la apertura
   */
  const abrir = (idCarrera, elementoOrigen) => {
    if (!overlay || !modal) return;

    const exito = poblarModal(idCarrera);
    if (!exito) return;

    ultimoEnfocado = elementoOrigen;
    estaAbierto    = true;

    // Mostrar overlay
    overlay.removeAttribute('aria-hidden');
    overlay.classList.add('modal-overlay--visible');

    // Bloquear scroll del fondo
    document.body.style.overflow = 'hidden';

    // Mover el foco al modal (accesibilidad)
    setTimeout(() => {
      const primerFocusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (primerFocusable) primerFocusable.focus();
    }, 300); // Esperar la animación de entrada
  };

  /**
   * Cierra el modal.
   */
  const cerrar = () => {
    if (!overlay) return;
    estaAbierto = false;

    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('modal-overlay--visible');

    // Restaurar scroll
    document.body.style.overflow = '';

    // Restaurar foco al elemento que abrió el modal
    if (ultimoEnfocado) {
      ultimoEnfocado.focus();
      ultimoEnfocado = null;
    }
  };

  /**
   * Trap de foco: mantiene el foco dentro del modal mientras está abierto.
   * @param {KeyboardEvent} evento
   */
  const trampaFoco = (evento) => {
    if (!estaAbierto || evento.key !== 'Tab') return;

    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const primero = focusables[0];
    const ultimo  = focusables[focusables.length - 1];

    if (evento.shiftKey) {
      // Shift+Tab: si el foco está en el primero, ir al último
      if (document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      }
    } else {
      // Tab: si el foco está en el último, volver al primero
      if (document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  };

  /**
   * Inicializa todos los event listeners del modal.
   */
  const init = () => {
    if (!overlay || !modal) return;

    // Botones de cerrar (X y "Cerrar")
    [btnCerrar, btnCerrarGh].forEach(btn => {
      if (btn) btn.addEventListener('click', cerrar);
    });

    // Click en el CTA: abre la ficha de matrícula (otra pestaña) con la carrera ya elegida
    if (btnCta) {
      btnCta.addEventListener('click', () => {
        btnCta.href = carreraActual
          ? `matricula.html?carrera=${encodeURIComponent(carreraActual)}`
          : 'matricula.html';
        cerrar();
      });
    }

    // Click en el overlay (fuera del panel) cierra el modal
    overlay.addEventListener('click', (evento) => {
      if (evento.target === overlay) cerrar();
    });

    // ESC cierra el modal
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && estaAbierto) cerrar();
    });

    // Trap de foco dentro del modal
    document.addEventListener('keydown', trampaFoco);

    // ── Delegación de eventos: botones "Ver Detalles" en las tarjetas ──
    // Un solo listener en el grid captura todos los clicks (más eficiente)
    const grid = document.getElementById('carreras-grid');
    if (grid) {
      grid.addEventListener('click', (evento) => {
        const btn = evento.target.closest('.card__btn-detalle');
        if (!btn) return;

        const idCarrera = btn.getAttribute('data-carrera');
        if (idCarrera) abrir(idCarrera, btn);
      });
    }
  };

  // API pública
  return { init, abrir, cerrar };

})();



/* ════════════════════════════════════════════════════════════════
   PASO 3: MÓDULOS ACORDEÓN Y FORMULARIO
   ════════════════════════════════════════════════════════════════ */

/* ─── MÓDULO 9: ACORDEÓN FAQ ─────────────────────────────────── */
const AcordeonFAQ = (() => {

  const triggers = document.querySelectorAll('.accordion__trigger');

  /**
   * Abre o cierra un item del acordeón.
   * Usa max-height para una animación CSS fluida.
   */
  const toggleItem = (trigger) => {
    const panel   = document.getElementById(trigger.getAttribute('aria-controls'));
    const abierto = trigger.getAttribute('aria-expanded') === 'true';

    // Cerrar todos los demás (one-open)
    triggers.forEach(t => {
      if (t !== trigger) {
        t.setAttribute('aria-expanded', 'false');
        const p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) { p.style.maxHeight = '0'; p.hidden = false; }
      }
    });

    // Alternar el actual
    if (abierto) {
      trigger.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0';
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      // Forzar reflow para que la animación funcione desde 0
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  };

  const init = () => {
    if (!triggers.length) return;

    triggers.forEach(trigger => {
      // Quitar el atributo `hidden` de todos los paneles y fijar max-height en 0
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (panel) {
        panel.removeAttribute('hidden');
        panel.style.maxHeight = '0';
      }

      trigger.addEventListener('click', () => toggleItem(trigger));

      // Teclado: Enter y Espacio
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleItem(trigger);
        }
      });
    });
  };

  return { init };

})();


/* ─── MÓDULO 10: FORMULARIO DE INSCRIPCIÓN ───────────────────── */
const FormularioInscripcion = (() => {

  // Referencias DOM
  const form          = document.getElementById('inscripcion-form');
  const formWrap      = document.getElementById('form-wrap');
  const successBox    = document.getElementById('form-success');
  const btnSubmit     = document.getElementById('btn-submit-form');
  const btnNuevo      = document.getElementById('btn-nueva-solicitud');
  const linkReintento = document.getElementById('success-reintentar');
  const txtAreaMensaje = document.getElementById('f-mensaje');
  const charCount     = document.getElementById('f-mensaje-count');

  /* ── Utilidades de validación ──────────────────────────────── */

  const esEmailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const esDniValido   = (v) => /^\d{8}$/.test(v);
  const esTelValido   = (v) => /^[\d\s\-+()]{7,12}$/.test(v.trim());

  /**
   * Muestra error en un campo y aplica clase .form-group--error.
   */
  const mostrarError = (idGrupo, mensaje) => {
    const grupo = document.getElementById(idGrupo);
    const span  = grupo ? grupo.querySelector('.form-error') : null;
    if (!grupo || !span) return;
    grupo.classList.add('form-group--error');
    grupo.classList.remove('form-group--valid');
    span.textContent = mensaje;
  };

  /**
   * Marca un campo como válido.
   */
  const mostrarValido = (idGrupo) => {
    const grupo = document.getElementById(idGrupo);
    const span  = grupo ? grupo.querySelector('.form-error') : null;
    if (!grupo || !span) return;
    grupo.classList.remove('form-group--error');
    grupo.classList.add('form-group--valid');
    span.textContent = '';
  };

  /**
   * Limpia el estado de un grupo.
   */
  const limpiarEstado = (idGrupo) => {
    const grupo = document.getElementById(idGrupo);
    if (!grupo) return;
    grupo.classList.remove('form-group--error', 'form-group--valid');
    const span = grupo.querySelector('.form-error');
    if (span) span.textContent = '';
  };

  /* ── Validación de todos los campos ───────────────────────── */

  const validarFormulario = () => {
    let valido = true;

    // Nombre
    const nombre = document.getElementById('f-nombre')?.value.trim() ?? '';
    if (nombre.length < 3) {
      mostrarError('fg-nombre', 'Ingresa tu nombre completo (mínimo 3 caracteres).');
      valido = false;
    } else {
      mostrarValido('fg-nombre');
    }

    // DNI
    const dni = document.getElementById('f-dni')?.value.trim() ?? '';
    if (!esDniValido(dni)) {
      mostrarError('fg-dni', 'El DNI debe tener exactamente 8 dígitos.');
      valido = false;
    } else {
      mostrarValido('fg-dni');
    }

    // Teléfono
    const tel = document.getElementById('f-telefono')?.value.trim() ?? '';
    if (!esTelValido(tel)) {
      mostrarError('fg-telefono', 'Ingresa un número de teléfono válido.');
      valido = false;
    } else {
      mostrarValido('fg-telefono');
    }

    // Email (opcional pero si se escribe debe ser válido)
    const email = document.getElementById('f-email')?.value.trim() ?? '';
    if (email && !esEmailValido(email)) {
      mostrarError('fg-email', 'Ingresa un correo electrónico válido.');
      valido = false;
    } else {
      mostrarValido('fg-email');
    }

    // Carrera
    const carrera = document.getElementById('f-carrera')?.value ?? '';
    if (!carrera) {
      mostrarError('fg-carrera', 'Selecciona la carrera de tu interés.');
      valido = false;
    } else {
      mostrarValido('fg-carrera');
    }

    return valido;
  };

  /* ── Envío por WhatsApp ────────────────────────────────────── */
  // Un sitio estático no tiene servidor que guarde los datos, así que la
  // solicitud se arma como mensaje y se abre en WhatsApp de la secretaría.

  const enviarPorWhatsApp = (nombreVal, carreraVal) => {
    const val   = (id) => document.getElementById(id)?.value.trim() ?? '';
    const turno = form.querySelector('input[name="turno"]:checked');
    const turnoTxt = turno ? turno.nextElementSibling.textContent.replace(/^\S+\s/, '') : '';

    const lineas = [
      'Hola, quiero inscribirme en el CETPRO Joaquín López Antay.',
      `Nombre: ${nombreVal}`,
      `DNI: ${val('f-dni')}`,
      `Celular: ${val('f-telefono')}`,
      val('f-email') && `Correo: ${val('f-email')}`,
      `Carrera: ${carreraVal}`,
      turnoTxt && `Turno: ${turnoTxt}`,
      val('f-mensaje') && `Mensaje: ${val('f-mensaje')}`,
    ].filter(Boolean);

    const url = enlaceWhatsApp(lineas.join('\n'));
    window.open(url, '_blank', 'noopener');

    // Mostrar confirmación con enlace de respaldo por si el navegador bloqueó la ventana
    form.hidden = true;
    if (successBox) {
      successBox.hidden = false;
      const elNombre  = document.getElementById('success-nombre');
      const elCarrera = document.getElementById('success-carrera');
      if (elNombre)  elNombre.textContent  = nombreVal;
      if (elCarrera) elCarrera.textContent = carreraVal;
      if (linkReintento) linkReintento.href = url;
    }
  };

  /* ── Resetear formulario ───────────────────────────────────── */

  const resetForm = () => {
    form.reset();
    form.hidden = false;
    if (successBox) successBox.hidden = true;
    // Limpiar estados de validación
    ['fg-nombre','fg-dni','fg-telefono','fg-email','fg-carrera','fg-mensaje']
      .forEach(limpiarEstado);
    if (charCount) charCount.textContent = '0 / 400';
  };

  /* ── Inicialización ────────────────────────────────────────── */

  const init = () => {
    if (!form) return;

    // ── Preseleccionar la carrera si llega en el enlace (matricula.html?carrera=panaderia) ──
    const carreraURL = new URLSearchParams(location.search).get('carrera');
    const selectCarrera = document.getElementById('f-carrera');
    if (carreraURL && selectCarrera?.querySelector(`option[value="${CSS.escape(carreraURL)}"]`)) {
      selectCarrera.value = carreraURL;
    }

    // ── Submit del formulario ──
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Correr validación
      const esValido = validarFormulario();
      if (!esValido) {
        // Hacer scroll al primer campo con error
        const primerError = form.querySelector('.form-group--error');
        if (primerError) {
          primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          primerError.querySelector('input, select, textarea')?.focus();
        }
        return;
      }

      // Obtener nombre y nombre de carrera para mensaje de éxito
      const nombreVal  = document.getElementById('f-nombre')?.value.trim() ?? '';
      const selectEl   = document.getElementById('f-carrera');
      const carreraVal = selectEl?.options[selectEl.selectedIndex]?.text ?? '';

      enviarPorWhatsApp(nombreVal, carreraVal);
    });

    // ── Validación en tiempo real (al salir de cada campo) ──
    ['f-nombre','f-dni','f-telefono','f-email','f-carrera'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', () => {
        // Micro-validación individual en blur
        const v = el.value.trim();
        const idGrupo = el.closest('.form-group')?.id;
        if (!idGrupo) return;

        if (el.required && !v) {
          mostrarError(idGrupo, 'Este campo es obligatorio.');
        } else if (id === 'f-dni' && v && !esDniValido(v)) {
          mostrarError(idGrupo, 'El DNI debe tener exactamente 8 dígitos.');
        } else if (id === 'f-telefono' && v && !esTelValido(v)) {
          mostrarError(idGrupo, 'Ingresa un número válido.');
        } else if (id === 'f-email' && v && !esEmailValido(v)) {
          mostrarError(idGrupo, 'Correo electrónico inválido.');
        } else if (v) {
          mostrarValido(idGrupo);
        } else {
          limpiarEstado(idGrupo);
        }
      });


      // Limpiar error al empezar a escribir
      el.addEventListener('input', () => {
        const idGrupo = el.closest('.form-group')?.id;
        if (idGrupo) limpiarEstado(idGrupo);
      });
    });

    // ── Contador de caracteres del textarea ──
    if (txtAreaMensaje && charCount) {
      txtAreaMensaje.addEventListener('input', () => {
        const len = txtAreaMensaje.value.length;
        charCount.textContent = `${len} / 400`;
      });
    }

    // ── Botón "Enviar otra solicitud" ──
    if (btnNuevo) {
      btnNuevo.addEventListener('click', resetForm);
    }

    // ── DNI: solo permitir dígitos ──
    const dniInput = document.getElementById('f-dni');
    if (dniInput) {
      dniInput.addEventListener('input', () => {
        dniInput.value = dniInput.value.replace(/\D/g, '').slice(0, 8);
      });
    }
  };

  return { init };

})();



/* ════════════════════════════════════════════════════════════════
   PASO 4: HERO, FOTOS DE CARRERAS Y REDES SOCIALES
   ════════════════════════════════════════════════════════════════ */

/* ─── MÓDULO 12: FOTOS DE LAS CARRERAS ───────────────────────── */
// Las fotos salen del panel: la imagen de cada especialidad y las fotos
// de la Galería asociadas a esa carrera. La tarjeta ya llega con su foto
// desde el servidor. Si una imagen falla, su contenedor desaparece.
const FotosCarreras = (() => {

  const crearFoto = (src, alt, clase) => {
    const fig = document.createElement('figure');
    fig.className = `foto ${clase}`;
    fig.hidden = true;
    const img = document.createElement('img');
    img.alt = alt;
    // eager: una imagen lazy dentro de un contenedor oculto nunca carga
    img.loading = 'eager';
    img.decoding = 'async';
    img.addEventListener('load', () => {
      fig.hidden = false;
      const section = fig.closest('section[hidden], #modal-fotos-section');
      if (section) section.hidden = false;
    });
    img.addEventListener('error', () => fig.remove());
    img.src = src;
    fig.append(img);
    return fig;
  };

  /** Fotos de una carrera: su imagen principal + las de la galería. */
  const fotosDe = (id) => {
    const lista = [];
    const principal = CARRERAS_DATA[id]?.imagen;
    if (principal) lista.push({ src: principal, titulo: '' });
    DATOS_SITIO.galeria.filter(g => g.carrera === id).forEach(g => lista.push(g));
    return lista.slice(0, 6);
  };

  /** Fotos para la galería del modal. */
  const galeria = (id, nombre) =>
    fotosDe(id).map((f, i) => crearFoto(f.src, f.titulo || `Taller de ${nombre}, foto ${i + 1}`, 'foto--galeria'));

  /** Mural "Así se vive en nuestros talleres": últimas fotos de la galería. */
  const mural = (contenedor) => {
    DATOS_SITIO.galeria.slice(0, 9).forEach(g => {
      const nombre = CARRERAS_DATA[g.carrera]?.nombre || '';
      const fig = crearFoto(g.src, g.titulo || `Taller de ${nombre}`.trim(), 'foto--mural');
      const pie = g.titulo || nombre;
      if (pie) {
        const caption = document.createElement('figcaption');
        caption.textContent = pie;
        fig.append(caption);
      }
      contenedor.append(fig);
    });
  };

  const init = () => {};

  return { init, galeria, mural };

})();


/* ─── MÓDULO 13: REDES SOCIALES ──────────────────────────────── */
// Aplica los enlaces de CONFIG a todo elemento con [data-red] y carga
// las publicaciones de Facebook y el video de YouTube al acercarse a la sección.
const Redes = (() => {

  const enlaces = {
    whatsapp: enlaceWhatsApp('Hola, quiero información sobre las carreras del CETPRO Joaquín López Antay.'),
    facebook: CONFIG.facebook,
    youtube:  CONFIG.youtube,
  };

  const cargarFacebook = () => {
    const cont = document.getElementById('fb-embed');
    if (!cont) return;
    // El plugin de Facebook acepta anchos de 180 a 500 px
    const ancho = Math.round(Math.min(500, Math.max(180, cont.clientWidth)));
    const alto  = Math.max(300, cont.clientHeight || 420);
    const src = 'https://www.facebook.com/plugins/page.php?' + new URLSearchParams({
      href: CONFIG.facebook, tabs: 'timeline', width: ancho, height: alto,
      small_header: 'true', adapt_container_width: 'true', hide_cover: 'false', show_facepile: 'false',
    });
    cont.innerHTML = `<iframe src="${src}" width="${ancho}" height="${alto}" title="Publicaciones recientes del CETPRO en Facebook"
      style="border:none;overflow:hidden" scrolling="no" loading="lazy" allow="encrypted-media"></iframe>`;
  };

  const cargarYouTube = () => {
    const cont = document.getElementById('yt-embed');
    if (!cont || !CONFIG.youtubeVideo) return;
    cont.hidden = false;
    cont.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(CONFIG.youtubeVideo)}"
      title="Video destacado del CETPRO" loading="lazy" allowfullscreen
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
  };

  const init = () => {
    document.querySelectorAll('[data-red]').forEach(a => {
      const url = enlaces[a.getAttribute('data-red')];
      if (url) a.href = url;
    });

    const seccion = document.getElementById('redes');
    if (!seccion) return;
    const cargar = () => { cargarFacebook(); cargarYouTube(); };

    // Cargar los contenidos externos solo cuando el visitante se acerca
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entradas) => {
        if (entradas.some(e => e.isIntersecting)) { io.disconnect(); cargar(); }
      }, { rootMargin: '400px' });
      io.observe(seccion);
    } else {
      cargar();
    }
  };

  return { init };

})();


// Mejora progresiva: los valores finales son legibles sin animación.
document.addEventListener('DOMContentLoaded', () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const counters = document.querySelectorAll('[data-counter]');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el = entry.target;
        const target = Number(el.dataset.counter);
        const start = performance.now();
        const frame = now => {
          const progress = reduced.matches ? 1 : Math.min((now - start) / 1000, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + el.dataset.suffix;
          if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => observer.observe(el));
  }

  const grid = document.getElementById('talleres-grid');
  if (grid) FotosCarreras.mural(grid);

  const testimonios = document.getElementById('testimonios-grid');
  if (testimonios) CONFIG.testimonios.forEach(item => {
    if (!item.nombre || !item.texto || !item.foto || !item.carrera) return;
    const card = document.createElement('figure');
    card.className = 'testimonio';
    card.hidden = true;
    const photo = document.createElement('img');
    photo.alt = item.nombre;
    photo.loading = 'eager';
    photo.width = 64;
    photo.height = 64;
    photo.addEventListener('load', () => {
      card.hidden = false;
      document.getElementById('egresados').hidden = false;
    });
    photo.addEventListener('error', () => card.remove());
    photo.src = item.foto;
    const quote = document.createElement('blockquote');
    quote.textContent = item.texto;
    const caption = document.createElement('figcaption');
    const name = document.createElement('strong');
    name.textContent = item.nombre;
    const career = document.createElement('span');
    career.textContent = item.carrera;
    caption.append(name, career);
    card.append(photo, quote, caption);
    testimonios.append(card);
  });
});
