/**
 * ================================================================
 * OFERTA FORMATIVA AUTORIZADA — RD N.° 02617-2026-UGEL-HGA
 * ----------------------------------------------------------------
 * Resolución Directoral de la UGEL Huamanga del 28 de mayo de 2026.
 * Es la fuente oficial de: nombre de cada programa, ciclo, familia
 * productiva, módulos, créditos y horas.
 *
 * db.js la aplica UNA sola vez sobre la base (clave de configuración
 * `oferta_rd_aplicada`). Los textos que el administrador ya cambió
 * desde el panel se respetan: una descripción solo se reemplaza si
 * sigue siendo la original de seed.sql (campo `antes`).
 * ================================================================
 */
'use strict';

const RESOLUCION = {
  numero: 'RD N.° 02617-2026-UGEL-HGA',
  fecha: '2026-05-28',
  emisor: 'Unidad de Gestión Educativa Local de Huamanga',
};

/** Datos de cada ciclo según los artículos 1.°, 2.° y 3.° de la RD. */
const CICLOS = {
  tecnico: {
    etiqueta: 'Ciclo Técnico',
    articulo: 'Artículo 1.°',
    vigencia: { desde: '2026-03-02', hasta: '2027-12-31' },
    certificacion: 'Título de Técnico y certificados modulares',
    modulos: 4, creditos: 80, horas: 2048,
  },
  auxiliar: {
    etiqueta: 'Ciclo Auxiliar Técnico',
    articulo: 'Artículo 2.°',
    vigencia: { desde: '2026-03-02', hasta: '2026-12-31' },
    certificacion: 'Título de Auxiliar Técnico y certificados modulares',
    modulos: 2, creditos: 40, horas: 1024,
  },
  basico: {
    etiqueta: 'Ciclo Básico',
    articulo: 'Artículo 3.°',
    vigencia: { desde: '2026-03-02', hasta: '2026-12-31' },
    certificacion: 'Certificado modular por cada módulo aprobado',
  },
};

/* Módulos de 20 créditos y 512 horas (ciclos Técnico y Auxiliar Técnico) */
const m512 = (nombre) => ({ nombre, creditos: 20, horas: 512 });
/* Módulos del Ciclo Básico: horas en el CETPRO + horas de práctica */
const mBasico = (nombre, cetpro, practica) => ({ nombre, horas: cetpro + practica, horas_cetpro: cetpro, horas_practica: practica });

const TURNOS = ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'];

const PROGRAMAS = [
  /* ── Ciclo Auxiliar Técnico (Art. 2.°) ─────────────────────── */
  {
    slug: 'administrativo', orden: 1, ciclo: 'auxiliar',
    nombre: 'Apoyo Administrativo',
    familia: 'Servicios prestados a empresas',
    modulos: [
      m512('Gestión de la información y actividades administrativas'),
      m512('Información automatizada y archivo'),
    ],
  },
  {
    slug: 'gastronomia', orden: 2, ciclo: 'auxiliar',
    nombre: 'Servicios Básicos Gastronómicos',
    familia: 'Hoteles y restaurantes',
    modulos: [
      m512('Técnicas culinarias'),
      m512('Artes culinarias y cocina peruana'),
    ],
  },
  {
    slug: 'soporte', orden: 3, ciclo: 'auxiliar',
    nombre: 'Soporte Técnico y Operaciones de Centros de Cómputo',
    familia: 'Tecnologías de la información y comunicación (TIC)',
    modulos: [
      m512('Mantenimiento y reparación de sistemas informáticos'),
      m512('Gestión de soporte técnico, seguridad y tecnologías de la información y comunicación'),
    ],
  },
  {
    slug: 'panaderia', orden: 4, ciclo: 'auxiliar',
    nombre: 'Panadería y Pastelería',
    familia: 'Industria alimentaria, bebidas y tabaco',
    modulos: [
      m512('Acondicionamiento, mezclado y tratamientos térmicos de productos de panadería y pastelería'),
      m512('Técnicas de biotecnología, elaboración y presentación de productos de panadería y pastelería'),
    ],
  },
  {
    slug: 'adultomayor', orden: 5, ciclo: 'auxiliar',
    nombre: 'Cuidado del Niño(a) y Adulto Mayor',
    familia: 'Servicios sociales y de salud',
    modulos: [
      m512('Cuidado y atención integral del niño(a)'),
      m512('Atención integral a la persona adulta mayor'),
    ],
    descripcion_corta: 'Brinda cuidado y atención integral a niñas, niños y personas adultas mayores, con calidez y profesionalismo.',
    descripcion: 'Desarrolla las competencias para el cuidado y la atención integral de niñas y niños, y para la atención integral de la persona adulta mayor: asistencia personal, movilización segura, higiene, alimentación y actividades de bienestar y recreación. Carrera con alta demanda en hogares, cunas, centros de reposo y servicios de salud.',
    antes: {
      descripcion_corta: 'Brinda cuidados básicos de salud, asistencia personal y actividades de bienestar para el adulto mayor con calidez y profesionalismo.',
      descripcion: 'Adquiere las competencias para brindar cuidados básicos de salud, asistencia personal, movilización segura y actividades de bienestar y recreación para adultos mayores. Carrera con alta demanda en hogares, centros de reposo y servicios de salud.',
    },
  },

  /* ── Ciclo Técnico (Art. 1.°) ──────────────────────────────── */
  {
    slug: 'estilismo', orden: 6, ciclo: 'tecnico',
    nombre: 'Estilismo',
    familia: 'Servicios personales y de hogares',
    modulos: [
      m512('Peluquería, barbería y peinados'),
      m512('Ondulación, laceado y tinturación del cabello'),
      m512('Maquillaje de belleza y caracterización'),
      m512('Manicure y pedicure'),
    ],
    descripcion: 'Formación completa en peluquería, barbería y peinados; ondulación, laceado y tinturación del cabello; maquillaje de belleza y caracterización; y manicure y pedicure. Al egresar tendrás las herramientas para abrir tu propio salón de belleza o trabajar en centros estéticos reconocidos.',
    antes: {
      descripcion: 'Formación completa en corte de cabello, peinados, coloración, tratamientos capilares, manicura y pedicura para damas y caballeros. Al egresar tendrás las herramientas para abrir tu propio salón de belleza o trabajar en centros estéticos reconocidos.',
    },
  },
  {
    slug: 'confeccion', orden: 7, ciclo: 'tecnico',
    nombre: 'Fabricación de Prendas de Vestir',
    familia: 'Industria textil, confección y del cuero',
    modulos: [
      m512('Control de calidad de la producción de prendas de vestir'),
      m512('Técnicas de trazado, tendido y corte de prendas de vestir'),
      m512('Técnicas de confección de prendas de vestir'),
      m512('Técnicas de proceso de acabados en prendas de vestir'),
    ],
    descripcion: 'Traza, tiende, corta y confecciona prendas de vestir con máquinas industriales de coser y remalladora, aplica los procesos de acabado y controla la calidad de la producción. Ideal para emprender tu propio taller o insertarte en la industria textil local.',
    antes: {
      descripcion: 'Diseña, traza, corta y confecciona prendas de vestir utilizando máquinas industriales de coser y overlook. Aprende patronaje, transformaciones y escalado. Ideal para emprender tu propio taller o insertarte en la industria textil local.',
    },
  },
  {
    slug: 'electronico', orden: 8, ciclo: 'tecnico',
    nombre: 'Mantenimiento de Sistemas Electrónicos',
    familia: 'Industrias diversas',
    modulos: [
      m512('Implementación y operación de sistemas electrónicos'),
      m512('Instalación y mantenimiento de sistemas eléctricos y electrónicos'),
      m512('Implementación de sistemas electrónicos programables (Semestre I)'),
      m512('Implementación de sistemas electrónicos programables (Semestre II)'),
    ],
    descripcion_corta: 'Instala, opera y mantiene sistemas eléctricos y electrónicos, incluidos los programables. Alta demanda laboral en Ayacucho y todo el Perú.',
    descripcion: 'Aprende a implementar, operar, instalar y mantener sistemas eléctricos y electrónicos, y a implementar sistemas electrónicos programables. Incluye diagnóstico y reparación de equipos, soldadura, lectura de circuitos y gestión de taller. Alta demanda laboral en Ayacucho y a nivel nacional.',
    antes: {
      descripcion_corta: 'Repara equipos electrónicos, celulares y electrodomésticos. Alta demanda laboral en Ayacucho y todo el Perú.',
      descripcion: 'Aprende a diagnosticar y reparar equipos electrónicos: televisores, equipos de sonido, celulares y electrodomésticos. Incluye soldadura, lectura de circuitos y gestión de taller. Alta demanda laboral en Ayacucho y a nivel nacional.',
    },
  },

  /* ── Ciclo Básico (Art. 3.°) ───────────────────────────────── */
  {
    slug: 'casas', orden: 9, ciclo: 'basico',
    nombre: 'Mantenimiento Básico de Casas y Edificios',
    familia: 'Construcción',
    modulos: [
      mBasico('Mantenimiento de carpintería', 210, 90),
      mBasico('Mantenimiento básico de instalaciones eléctricas', 168, 72),
      mBasico('Mantenimiento en albañilería', 210, 90),
      mBasico('Mantenimiento básico de gasfitería', 168, 72),
    ],
    descripcion_corta: 'Carpintería, instalaciones eléctricas, albañilería y gasfitería para el mantenimiento de casas y edificios. Módulos cortos y prácticos.',
    descripcion: 'Aprende el mantenimiento de carpintería, instalaciones eléctricas domiciliarias, albañilería y gasfitería. Cada módulo es independiente y otorga su propio certificado modular: puedes llevar uno o todos. Una formación práctica para trabajar de forma independiente o en empresas de construcción y mantenimiento.',
    antes: {
      descripcion_corta: 'Aprende plomería básica, instalaciones eléctricas domiciliarias, pintura y carpintería para el mantenimiento del hogar.',
      descripcion: 'Aprende plomería básica, instalaciones eléctricas domiciliarias seguras, pintura de interiores y exteriores, y carpintería básica. Una formación práctica para trabajar de forma independiente o en empresas de construcción y mantenimiento.',
    },
  },
  {
    // Programa nuevo: no existía en la web anterior
    slug: 'metales', orden: 10, ciclo: 'basico', nuevo: true,
    nombre: 'Mecánica y Metales',
    familia: 'Mecánica y metales',
    color: '#4A5A68',
    modulos: [
      mBasico('Soldadura por arco eléctrico', 210, 90),
      mBasico('Cerrajería metálica', 168, 72),
      mBasico('Soldadura y calderería', 210, 90),
      mBasico('Mantenimiento de soldadura semiautomática', 168, 72),
    ],
    descripcion_corta: 'Soldadura por arco eléctrico y semiautomática, cerrajería metálica y calderería. Módulos cortos con práctica en taller.',
    descripcion: 'Aprende soldadura por arco eléctrico, cerrajería metálica, soldadura y calderería, y mantenimiento de soldadura semiautomática. Cada módulo es independiente y otorga su propio certificado modular. Ideal para trabajar en talleres de metalmecánica, construcción o emprender tu propio taller de puertas, rejas y estructuras.',
    requisitos: [
      'Certificado de estudios primarios',
      'Copia del Documento Nacional de Identidad (DNI)',
      '2 fotografías tamaño carné (fondo blanco)',
      'Tener entre 15 y 55 años de edad',
    ],
    turnos: TURNOS,
    icono_svg: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"> <path d="M10 38 L26 22" stroke="#4A5A68" stroke-width="3" stroke-linecap="round"/> <path d="M24 16 l8 8 -4 4 -8 -8z" stroke="#4A5A68" stroke-width="2.5" stroke-linejoin="round"/> <path d="M32 24 l4 4" stroke="#4A5A68" stroke-width="2.5" stroke-linecap="round"/> <circle cx="38" cy="30" r="1.6" fill="#F9BB23"/> <circle cx="41" cy="26" r="1.2" fill="#F9BB23"/> <circle cx="36" cy="35" r="1.2" fill="#EC6E17"/> <line x1="6" y1="42" x2="42" y2="42" stroke="#4A5A68" stroke-width="2.5" stroke-linecap="round"/> </svg>',
  },
];

/** Duración que se muestra en la tarjeta y en el modal. */
function duracionDe(p) {
  if (p.ciclo === 'basico') {
    const horas = p.modulos.map(m => m.horas);
    return { duracion: `${p.modulos.length} módulos de ${Math.min(...horas)} a ${Math.max(...horas)} horas`, duracion_corta: 'Módulos' };
  }
  const c = CICLOS[p.ciclo];
  const anios = p.ciclo === 'tecnico' ? '2 años' : '1 año';
  return {
    duracion: `${anios} · ${c.modulos} módulos · ${c.horas} horas`,
    duracion_corta: p.ciclo === 'tecnico' ? '2 Años' : '1 Año',
  };
}

module.exports = { RESOLUCION, CICLOS, PROGRAMAS, duracionDe };
