/**
 * ================================================================
 * CETPRO JOAQUÍN LÓPEZ ANTAY — JavaScript Principal
 * script.js | Versión 1.0 | Paso 1 — Header / Navbar
 * Vanilla JS puro (ES6+) — Sin librerías externas
 * ================================================================
 */

'use strict';

/* ════════════════════════════════════════════════════════════════
   ⚠️ CONFIGURACIÓN — editar aquí los datos de contacto y redes
   ════════════════════════════════════════════════════════════════ */
const CONFIG = {
  // Número de WhatsApp con código de país, sin "+" ni espacios (ej.: 51987654321)
  whatsapp: '51900000000',
  facebook: 'https://www.facebook.com/cetprojla',
  youtube:  'https://www.youtube.com/@[CANAL_DEL_CETPRO]',
  // ID del video destacado: lo que va después de "v=" en el enlace de YouTube.
  // Vacío = se muestra un aviso de "próximamente".
  youtubeVideo: '',
  // Carpeta de fotos de las carreras. Nombres: <carrera>-1.jpg, <carrera>-2.jpg, <carrera>-3.jpg
  // (ej.: panaderia-1.jpg). La -1 aparece en la tarjeta; las tres, en "Ver Detalles".
  rutaFotos: 'img/carreras/',
  fotosPorCarrera: 3,
};

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
  Retablo.init(prefiereMenosMovimiento);
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
const CARRERAS_DATA = {

  gastronomia: {
    nombre:      'Servicio Básico Gastronómico',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#E84A12',
    colorSoft:   'rgba(232,74,18,0.10)',
    descripcion: 'Aprenderás técnicas profesionales de preparación de alimentos, gestión de cocina, manipulación higiénica de alimentos y atención al cliente en establecimientos gastronómicos. Perfecto para emprender tu propio negocio o trabajar en restaurantes y hoteles.',
    requisitos: [
      'Certificado de estudios primarios o secundarios',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud (se tramita en el CESAMICA)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)'],
  },

  panaderia: {
    nombre:      'Panadería',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#D97706',
    colorSoft:   'rgba(217,119,6,0.10)',
    descripcion: 'Domina técnicas de panadería artesanal e industrial, pastelería básica y producción de panes tradicionales ayacuchanos y modernos. Desarrolla las habilidades para abrir tu propia panadería o trabajar en la industria alimentaria.',
    requisitos: [
      'Certificado de estudios primarios completos',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud actualizado',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (7:00 – 12:00)', 'Tarde (13:00 – 18:00)'],
  },

  adultomayor: {
    nombre:      'Cuidado del Adulto Mayor',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#C8006A',
    colorSoft:   'rgba(200,0,106,0.10)',
    descripcion: 'Adquiere las competencias para brindar cuidados básicos de salud, asistencia personal, movilización segura y actividades de bienestar y recreación para adultos mayores. Carrera con alta demanda en hogares, centros de reposo y servicios de salud.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud y de buena conducta',
      'Tener entre 18 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)'],
  },

  casas: {
    nombre:      'Mantenimiento de Casas',
    ciclo:       'Ciclo Auxiliar Técnico',
    duracion:    '1 Año de estudio',
    color:       '#2563EB',
    colorSoft:   'rgba(37,99,235,0.10)',
    descripcion: 'Aprende plomería básica, instalaciones eléctricas domiciliarias seguras, pintura de interiores y exteriores, y carpintería básica. Una formación práctica para trabajar de forma independiente o en empresas de construcción y mantenimiento.',
    requisitos: [
      'Certificado de estudios primarios',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)'],
  },

  estilismo: {
    nombre:      'Estilismo',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#9333EA',
    colorSoft:   'rgba(147,51,234,0.10)',
    descripcion: 'Formación completa en corte de cabello, peinados, coloración, tratamientos capilares, manicura y pedicura para damas y caballeros. Al egresar tendrás las herramientas para abrir tu propio salón de belleza o trabajar en centros estéticos reconocidos.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Certificado de salud actualizado',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)', 'Noche (19:00 – 22:00)'],
  },

  electronico: {
    nombre:      'Mantenimiento Electrónico',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#0891B2',
    colorSoft:   'rgba(8,145,178,0.10)',
    descripcion: 'Aprende a diagnosticar y reparar equipos electrónicos: televisores, equipos de sonido, celulares y electrodomésticos. Incluye soldadura, lectura de circuitos y gestión de taller. Alta demanda laboral en Ayacucho y a nivel nacional.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)'],
  },

  confeccion: {
    nombre:      'Confección de Prendas',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#059669',
    colorSoft:   'rgba(5,150,105,0.10)',
    descripcion: 'Diseña, traza, corta y confecciona prendas de vestir utilizando máquinas industriales de coser y overlook. Aprende patronaje, transformaciones y escalado. Ideal para emprender tu propio taller o insertarte en la industria textil local.',
    requisitos: [
      'Certificado de estudios primarios completos',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)'],
  },

  soporte: {
    nombre:      'Soporte Técnico',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#1D4ED8',
    colorSoft:   'rgba(29,78,216,0.10)',
    descripcion: 'Formación en mantenimiento preventivo y correctivo de computadoras, instalación de sistemas operativos y software, configuración de redes básicas y soporte a usuarios. Una de las carreras con mayor empleabilidad en el sector público y privado.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Conocimientos básicos de computadora (deseable)',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)'],
  },

  administrativo: {
    nombre:      'Apoyo Administrativo',
    ciclo:       'Ciclo Técnico',
    duracion:    '2 Años de estudio',
    color:       '#7C3AED',
    colorSoft:   'rgba(124,58,237,0.10)',
    descripcion: 'Capacitación en contabilidad básica, gestión y organización documental, digitación avanzada, atención al cliente y manejo de software de oficina (Word, Excel). Indispensable en toda empresa, municipalidad u oficina pública de Ayacucho.',
    requisitos: [
      'Secundaria completa (obligatorio)',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 16 y 55 años de edad',
    ],
    turnos: ['Mañana (8:00 – 13:00)', 'Tarde (14:00 – 19:00)'],
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
   * @param {string} filtro - 'todos' | 'auxiliar' | 'tecnico'
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
      elCicloBadge.style.color = esTecnico ? '#1D4ED8' : datos.color;
    }

    // ── Título, duración, descripción ──
    if (elTitulo)   elTitulo.textContent   = datos.nombre;
    if (elDuracion) elDuracion.textContent  = `📅 ${datos.duracion}`;
    if (elDesc)     elDesc.textContent      = datos.descripcion;

    // ── Lista de requisitos ──
    if (elRequisitos) {
      elRequisitos.innerHTML = datos.requisitos
        .map(req => `<li>${req}</li>`)
        .join('');
    }

    // ── Chips de turnos ──
    if (elTurnos) {
      elTurnos.innerHTML = datos.turnos
        .map(turno => `<span class="turno-chip">🕐 ${turno}</span>`)
        .join('');
    }

    // ── Galería de fotos del taller ──
    if (elGaleria) {
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

    // Click en el CTA: preselecciona la carrera en el formulario y cierra el modal
    if (btnCta) {
      btnCta.addEventListener('click', () => {
        const select = document.getElementById('f-carrera');
        if (select && carreraActual) select.value = carreraActual;
        ultimoEnfocado = null; // no devolver el foco a la tarjeta: vamos al formulario
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

/* ─── MÓDULO 11: RETABLO DEL HERO ────────────────────────────── */
// Las puertas se abren solas al cargar; un toque las abre o cierra.
const Retablo = (() => {

  const btn = document.getElementById('retablo');

  const setAbierto = (abierto) => {
    btn.classList.toggle('retablo-btn--abierto', abierto);
    btn.setAttribute('aria-pressed', String(abierto));
  };

  const init = (sinMovimiento) => {
    if (!btn) return;
    btn.addEventListener('click', () =>
      setAbierto(!btn.classList.contains('retablo-btn--abierto')));
    setTimeout(() => setAbierto(true), sinMovimiento ? 0 : 700);
  };

  return { init };

})();


/* ─── MÓDULO 12: FOTOS DE LAS CARRERAS ───────────────────────── */
// Busca las fotos en CONFIG.rutaFotos. Si una foto todavía no existe,
// muestra un recuadro "Foto próximamente" en su lugar.
const FotosCarreras = (() => {

  const PLACEHOLDER = `
    <span class="foto__vacia" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 7h3l2-2h6l2 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>
      </svg>
      Foto próximamente
    </span>`;

  /**
   * Crea un <figure> con la foto; si no carga, deja visible el recuadro vacío.
   */
  const crearFoto = (src, alt, clase) => {
    const fig = document.createElement('figure');
    fig.className = `foto ${clase}`;
    fig.innerHTML = PLACEHOLDER;

    const img = document.createElement('img');
    img.alt      = alt;
    img.loading  = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove());
    img.src = src;
    fig.prepend(img);
    return fig;
  };

  const ruta = (id, n) => `${CONFIG.rutaFotos}${id}-${n}.jpg`;

  /** Fotos para la galería del modal. */
  const galeria = (id, nombre) =>
    Array.from({ length: CONFIG.fotosPorCarrera }, (_, i) =>
      crearFoto(ruta(id, i + 1), `Taller de ${nombre}, foto ${i + 1}`, 'foto--galeria'));

  /** Coloca la foto principal en la parte superior de cada tarjeta. */
  const init = () => {
    document.querySelectorAll('.card[data-carrera]').forEach(card => {
      const id     = card.getAttribute('data-carrera');
      const nombre = CARRERAS_DATA[id]?.nombre ?? '';
      card.prepend(crearFoto(ruta(id, 1), `Estudiantes en el taller de ${nombre}`, 'card__foto'));
    });
  };

  return { init, galeria };

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
    const src = 'https://www.facebook.com/plugins/page.php?' + new URLSearchParams({
      href: CONFIG.facebook, tabs: 'timeline', width: ancho, height: 480,
      small_header: 'true', adapt_container_width: 'true', hide_cover: 'false', show_facepile: 'false',
    });
    cont.innerHTML = `<iframe src="${src}" width="${ancho}" height="480" title="Publicaciones recientes del CETPRO en Facebook"
      style="border:none;overflow:hidden" scrolling="no" loading="lazy" allow="encrypted-media"></iframe>`;
  };

  const cargarYouTube = () => {
    const cont = document.getElementById('yt-embed');
    if (!cont || !CONFIG.youtubeVideo) return;
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
