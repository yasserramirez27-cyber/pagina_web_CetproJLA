/**
 * ================================================================
 * RENDER DEL SITIO PÚBLICO
 * Arma, en el servidor, los bloques HTML que salen de la base de
 * datos: tarjetas de especialidades, convocatoria, noticias, etc.
 * Todo texto de la BD pasa por esc() antes de llegar al HTML.
 * ================================================================
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const db   = require('../../database/db');
const { RESOLUCION, CICLOS } = require('../../database/oferta-rd-02617');

const RUTA_PAGINAS = path.join(__dirname, '..', 'pages');

/* ── Utilidades ──────────────────────────────────────────────── */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const suave = (hex, a = 0.10) => {
  const n = parseInt(String(hex).slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'];
const fechaCorta = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
};
const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/**
 * Reemplaza {{clave}} (texto escapado) y {{{clave}}} (HTML ya armado).
 * Las claves que no existen quedan vacías.
 */
function plantilla(html, vars) {
  return html.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{\s*([\w.]+)\s*\}\}/g, (_, crudo, normal) =>
    crudo ? String(vars[crudo] ?? '') : esc(vars[normal]));
}

const leerPagina = (nombre) => fs.readFileSync(path.join(RUTA_PAGINAS, nombre), 'utf8');

/* ── Lecturas de la BD ───────────────────────────────────────── */
function leerConfig() {
  const cfg = {};
  db.todos('SELECT clave, valor FROM configuracion').forEach(f => { cfg[f.clave] = f.valor; });
  return cfg;
}

function especialidadesPublicadas() {
  return db.todos(`SELECT * FROM especialidades WHERE estado = 'publicado' ORDER BY orden, id`)
    .map(e => ({ ...e, requisitos: JSON.parse(e.requisitos), turnos: JSON.parse(e.turnos), modulos: JSON.parse(e.modulos || '[]') }));
}

function convocatoriaVigente() {
  const c = db.uno(
    `SELECT * FROM convocatorias
      WHERE estado = 'publicado' AND (fecha_fin IS NULL OR fecha_fin >= ?)
      ORDER BY COALESCE(fecha_inicio, creado) DESC LIMIT 1`, [hoyISO()]);
  return c && { ...c, requisitos: JSON.parse(c.requisitos) };
}

/** Nombre visible de cada ciclo y clase CSS de su etiqueta. */
const ETIQUETA_CICLO = { auxiliar: 'Auxiliar Técnico', tecnico: 'Ciclo Técnico', basico: 'Ciclo Básico' };
const NOMBRE_CICLO = (ciclo) => CICLOS[ciclo]?.etiqueta || 'Ciclo Auxiliar Técnico';
const claseCiclo = (prefijo, ciclo) => (ciclo === 'auxiliar' ? '' : ` ${prefijo}${ciclo}`);
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES_LARGOS[m - 1]} de ${a}`;
};

/* ── Componentes HTML ────────────────────────────────────────── */
const ICONO_GENERICO = (color) =>
  `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M6 18 24 9l18 9-18 9-18-9Z" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/><path d="M13 22v9c0 3 5 6 11 6s11-3 11-6v-9" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><path d="M42 18v11" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/></svg>`;

function tarjetaEspecialidad(e) {
  const ciclo = ETIQUETA_CICLO[e.ciclo] ? e.ciclo : 'auxiliar';
  const color = esc(e.color);
  // icono_svg solo viene de la semilla (no se edita desde el panel)
  const icono = e.icono_svg || ICONO_GENERICO(color);
  const foto = e.imagen
    ? `<figure class="foto card__foto"><img src="${esc(e.imagen)}" alt="Estudiantes en el taller de ${esc(e.nombre)}" loading="lazy" decoding="async"></figure>`
    : '';
  return `
          <article class="card" data-category="${ciclo}" data-carrera="${esc(e.slug)}"
            style="--card-color:${color}; --card-soft:${suave(e.color)};"
            aria-label="Programa: ${esc(e.nombre)}">${foto}
            <div class="card__header">
              <div class="card__icon" style="background:var(--card-soft); border-color:var(--card-color)">
                ${icono}
              </div>
              <div class="card__badges">
                <span class="badge badge--ciclo${claseCiclo('badge--ciclo-', ciclo)}">${esc(e.duracion_corta)}</span>
              </div>
            </div>
            <div class="card__body">
              <h3 class="card__title">${esc(e.nombre)}</h3>
              <p class="card__desc">${esc(e.descripcion_corta)}</p>
              ${e.modulos.length ? `<p class="card__modulos">${e.modulos.length} módulos${e.familia ? ` · ${esc(e.familia)}` : ''}</p>` : ''}
            </div>
            <div class="card__footer">
              <span class="card__ciclo-tag${claseCiclo('card__ciclo-tag--', ciclo)}">${ETIQUETA_CICLO[ciclo]}</span>
              <button class="btn card__btn-detalle" data-carrera="${esc(e.slug)}"
                aria-label="Ver detalles de ${esc(e.nombre)}" type="button">
                Ver Detalles →
              </button>
            </div>
            <div class="card__glow" aria-hidden="true"></div>
          </article>`;
}

/**
 * Respaldo legal: la oferta vigente según la RD de la UGEL Huamanga.
 * Cuenta solo los programas publicados de cada ciclo.
 */
function seccionOferta(esps) {
  const bloques = ['tecnico', 'auxiliar', 'basico'].map(ciclo => {
    const c = CICLOS[ciclo];
    const items = esps.filter(e => e.ciclo === ciclo);
    if (!items.length) return '';
    const modulos = items.reduce((n, e) => n + e.modulos.length, 0);
    const datos = ciclo === 'basico'
      ? [`${items.length} ${items.length === 1 ? 'opción ocupacional' : 'opciones ocupacionales'}`, `${modulos} módulos independientes`, 'De 240 a 300 horas por módulo']
      : [`${items.length} ${items.length === 1 ? 'programa' : 'programas'} de estudio`, `${c.modulos} módulos · ${c.creditos} créditos`, `${c.horas} horas en total`];
    return `
          <article class="oferta-ciclo oferta-ciclo--${ciclo}">
            <span class="oferta-ciclo__articulo">${esc(c.articulo)}</span>
            <h3>${esc(c.etiqueta)}</h3>
            <ul class="oferta-ciclo__datos">${datos.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
            <ul class="oferta-ciclo__programas">${items.map(e => `<li>${esc(e.nombre)}</li>`).join('')}</ul>
            <p class="oferta-ciclo__cert"><strong>Certifica:</strong> ${esc(c.certificacion)}</p>
            <p class="oferta-ciclo__vigencia">Vigencia: del ${esc(fechaLarga(c.vigencia.desde))} al ${esc(fechaLarga(c.vigencia.hasta))}</p>
          </article>`;
  }).join('');
  if (!bloques) return '';
  return `
    <section id="oferta-autorizada" class="section oferta-section" aria-labelledby="oferta-title">
      <div class="section__container">
        <div class="section__header">
          <span class="section__eyebrow" aria-hidden="true">✦ Oferta con respaldo oficial</span>
          <h2 id="oferta-title" class="section__title">Programas <span class="section__title-highlight">autorizados</span></h2>
          <p class="section__subtitle">
            Nuestra oferta formativa está aprobada por la ${esc(RESOLUCION.emisor)} mediante la
            <strong>${esc(RESOLUCION.numero)}</strong> del ${esc(fechaLarga(RESOLUCION.fecha))}, conforme al Catálogo Nacional
            de la Oferta Formativa (RVM N.° 049-2022-MINEDU) y los Lineamientos Académicos para los CETPRO (RVM N.° 188-2020-MINEDU).
          </p>
        </div>
        <div class="oferta-grid">${bloques}
        </div>
        <p class="oferta-nota">
          Los certificados modulares se emiten en el formato del Modelo Único Nacional y se registran en los sistemas
          de información académica. Los títulos se otorgan a solicitud del egresado, previo cumplimiento de los requisitos.
        </p>
      </div>
    </section>`;
}

function bannerConvocatoria(c) {
  if (!c) return '';
  const fechas = [c.fecha_inicio && `Desde el ${fechaCorta(c.fecha_inicio)}`, c.fecha_fin && `hasta el ${fechaCorta(c.fecha_fin)}`]
    .filter(Boolean).join(' ');
  const datos = [fechas, c.vacantes ? `${c.vacantes} vacantes` : ''].filter(Boolean)
    .map(t => `<li>${esc(t)}</li>`).join('');
  const requisitos = c.requisitos.length
    ? `<h3>Requisitos</h3><ul>${c.requisitos.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : '';
  return `
    <section id="convocatoria" class="convocatoria" aria-labelledby="convocatoria-titulo">
      <div class="section__container">
        <details class="convocatoria__caja">
          <summary>
            <span class="convocatoria__icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            </span>
            <span class="convocatoria__texto">
              <strong id="convocatoria-titulo">${esc(c.titulo)}</strong>
              ${datos ? `<ul class="convocatoria__datos">${datos}</ul>` : ''}
            </span>
            <span class="convocatoria__boton">Ver convocatoria <span aria-hidden="true">→</span></span>
          </summary>
          <div class="convocatoria__detalle">
            ${c.descripcion ? `<p>${esc(c.descripcion).replace(/\n/g, '<br>')}</p>` : ''}
            ${requisitos}
            <a class="btn btn--cta" href="/matricula.html">Inscríbete ahora</a>
          </div>
        </details>
      </div>
    </section>`;
}

function seccionNoticias(lista) {
  if (!lista.length) return '';
  const tarjetas = lista.map(n => `
          <article class="noticia-card">
            <a href="/noticias/${n.id}" class="noticia-card__enlace">
              <figure class="foto noticia-card__foto">${n.imagen
                ? `<img src="${esc(n.imagen)}" alt="" loading="lazy" decoding="async">`
                : '<span class="noticia-card__sin-foto" aria-hidden="true">✦</span>'}</figure>
              <div class="noticia-card__cuerpo">
                <time datetime="${esc(n.fecha)}">${esc(fechaCorta(n.fecha))}</time>
                <h3>${esc(n.titulo)}</h3>
                ${n.resumen ? `<p>${esc(n.resumen)}</p>` : ''}
                <span class="noticia-card__mas">Leer más <span aria-hidden="true">→</span></span>
              </div>
            </a>
          </article>`).join('');
  return `
    <section id="noticias" class="section noticias-section" aria-labelledby="noticias-title">
      <div class="section__container">
        <div class="section__header">
          <span class="section__eyebrow" aria-hidden="true">✦ Vida institucional</span>
          <h2 id="noticias-title" class="section__title">Noticias y <span class="section__title-highlight">actividades</span></h2>
        </div>
        <div class="noticias-grid">${tarjetas}
        </div>
      </div>
    </section>`;
}

function opcionesCarreras(esps) {
  const grupo = (ciclo, etiqueta) => {
    const items = esps.filter(e => e.ciclo === ciclo);
    if (!items.length) return '';
    return `<optgroup label="${etiqueta}">${items.map(e => `<option value="${esc(e.slug)}">${esc(e.nombre)}</option>`).join('')}</optgroup>`;
  };
  return grupo('auxiliar', 'Ciclo Auxiliar Técnico (1 Año)') + grupo('tecnico', 'Ciclo Técnico (2 Años)')
    + grupo('basico', 'Ciclo Básico (módulos)');
}

/**
 * Datos que necesita main.js en el navegador. Va como JSON en un
 * <script type="application/json">: no se ejecuta y respeta la CSP.
 */
function bloqueDatos(cfg, esps, galeria) {
  const datos = {
    config: {
      whatsapp: cfg.whatsapp, facebook: cfg.facebook,
      youtube: cfg.youtube, youtubeVideo: cfg.youtube_video,
    },
    especialidades: Object.fromEntries(esps.map(e => [e.slug, {
      nombre: e.nombre,
      ciclo: NOMBRE_CICLO(e.ciclo),
      familia: e.familia || '',
      modulos: e.modulos,
      duracion: e.duracion,
      color: e.color,
      colorSoft: suave(e.color),
      descripcion: e.descripcion,
      requisitos: e.requisitos,
      turnos: e.turnos,
      imagen: e.imagen || '',
    }])),
    galeria: galeria.map(g => ({ src: g.archivo, titulo: g.titulo, carrera: g.slug || '' })),
  };
  // < evita que un texto con "</script>" rompa el bloque
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  return `<script id="datos-sitio" type="application/json">${json}</script>`;
}

/** Variables comunes de configuración para las plantillas (cfg_*). */
function varsConfig(cfg) {
  const v = {};
  for (const [k, val] of Object.entries(cfg)) v[`cfg_${k}`] = val;
  v.cfg_telefono_fijo_tel = '+51' + (cfg.telefono_fijo || '').replace(/\D/g, '');
  v.cfg_celular_tel = '+51' + (cfg.celular || '').replace(/\D/g, '');
  v.anio = new Date().getFullYear();
  return v;
}

function galeriaPublica() {
  return db.todos(`SELECT g.archivo, g.titulo, e.slug FROM galeria g
    LEFT JOIN especialidades e ON e.id = g.especialidad_id AND e.estado = 'publicado'
    ORDER BY g.id DESC LIMIT 60`);
}

/* ── Páginas completas ───────────────────────────────────────── */
function paginaInicio() {
  const cfg = leerConfig();
  const esps = especialidadesPublicadas();
  const noticias = db.todos(
    `SELECT id, titulo, fecha, resumen, imagen FROM noticias
      WHERE estado = 'publicado' ORDER BY fecha DESC, id DESC LIMIT 3`);
  const ciclos = new Set(esps.map(e => e.ciclo)).size;

  return plantilla(leerPagina('index.html'), {
    ...varsConfig(cfg),
    total_carreras: esps.length,
    total_ciclos: ciclos,
    tarjetas: esps.map(tarjetaEspecialidad).join('\n'),
    oferta: seccionOferta(esps),
    convocatoria: bannerConvocatoria(convocatoriaVigente()),
    noticias: seccionNoticias(noticias),
    opciones_consulta: esps.map(e => `<option>${esc(e.nombre)}</option>`).join(''),
    datos_sitio: bloqueDatos(cfg, esps, galeriaPublica()),
  });
}

function paginaMatricula() {
  const cfg = leerConfig();
  const esps = especialidadesPublicadas();
  return plantilla(leerPagina('matricula.html'), {
    ...varsConfig(cfg),
    opciones_carreras: opcionesCarreras(esps),
    datos_sitio: bloqueDatos(cfg, esps, []),
  });
}

function paginaNoticia(id) {
  const n = db.uno(`SELECT * FROM noticias WHERE id = ? AND estado = 'publicado'`, [id]);
  if (!n) return null;
  const cfg = leerConfig();
  const parrafos = esc(n.contenido || n.resumen).split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  return plantilla(leerPagina('noticia.html'), {
    ...varsConfig(cfg),
    titulo: n.titulo,
    resumen: n.resumen,
    fecha_iso: n.fecha,
    fecha: fechaCorta(n.fecha),
    imagen: n.imagen ? `<figure class="noticia__foto"><img src="${esc(n.imagen)}" alt=""></figure>` : '',
    contenido: parrafos,
  });
}

module.exports = { esc, plantilla, leerConfig, paginaInicio, paginaMatricula, paginaNoticia, convocatoriaVigente, hoyISO };
