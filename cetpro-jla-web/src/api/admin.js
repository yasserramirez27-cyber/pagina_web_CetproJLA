/**
 * ================================================================
 * API DEL PANEL: /api/admin/*  (requiere sesión iniciada)
 * Un bloque por módulo del menú lateral.
 * ================================================================
 */
'use strict';

const express = require('express');
const db = require('../../database/db');
const { requiereSesion, antiCSRF } = require('../utils/auth');
const { recibir, guardarImagen, borrarImagen } = require('../utils/subidas');
const v = require('../utils/validar');
const { convocatoriaVigente } = require('../utils/render');

const router = express.Router();
router.use(requiereSesion, antiCSRF);

const ESTADOS = ['publicado', 'borrador'];
const json = (s) => { try { return JSON.parse(s); } catch { return []; } };
const ahora = `datetime('now','localtime')`;

/** Busca una fila por id o responde 404. */
function buscar(tabla, id, res) {
  const fila = db.uno(`SELECT * FROM ${tabla} WHERE id = ?`, [Number(id)]);
  if (!fila) res.status(404).json({ error: 'No se encontró el registro.' });
  return fila;
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════ */
router.get('/resumen', (req, res) => {
  const n = (sql) => db.uno(sql).n;
  res.json({
    especialidades: { total: n('SELECT COUNT(*) n FROM especialidades'), publicadas: n(`SELECT COUNT(*) n FROM especialidades WHERE estado='publicado'`) },
    noticias:       { total: n('SELECT COUNT(*) n FROM noticias'),       publicadas: n(`SELECT COUNT(*) n FROM noticias WHERE estado='publicado'`) },
    imagenes:       { total: n('SELECT COUNT(*) n FROM galeria') },
    consultas:      { total: n('SELECT COUNT(*) n FROM consultas'),      sinLeer: n('SELECT COUNT(*) n FROM consultas WHERE leido = 0') },
    convocatoria:   convocatoriaVigente(),
    ultimasConsultas: db.todos('SELECT id, nombre, especialidad, mensaje, leido, creado FROM consultas ORDER BY id DESC LIMIT 5'),
    whatsappDeEjemplo: (db.uno(`SELECT valor FROM configuracion WHERE clave='whatsapp'`)?.valor || '') === '51900000000',
  });
});

/* ════════════════════════════════════════════════════════════════
   ESPECIALIDADES
   ════════════════════════════════════════════════════════════════ */
// `familia` y `modulos` vienen de la RD N.° 02617-2026-UGEL-HGA (database/oferta-rd-02617.js);
// el formulario del panel no los envía, por eso el UPDATE no los toca.
const especialidad = (e) => ({ ...e, requisitos: json(e.requisitos), turnos: json(e.turnos), modulos: json(e.modulos || '[]') });
const DURACION_CORTA = { tecnico: '2 Años', auxiliar: '1 Año', basico: 'Módulos' };

function datosEspecialidad(b) {
  const ciclo = v.opcion(b.ciclo, ['auxiliar', 'tecnico', 'basico'], 'Ciclo');
  return {
    nombre:            v.texto(b.nombre, 'Nombre', { max: 80, requerido: true }),
    ciclo,
    duracion:          v.texto(b.duracion, 'Duración', { max: 40, requerido: true }),
    duracion_corta:    v.texto(b.duracion_corta, 'Duración corta', { max: 15 }) || DURACION_CORTA[ciclo],
    color:             v.color(b.color),
    descripcion_corta: v.texto(b.descripcion_corta, 'Descripción corta', { max: 220, requerido: true }),
    descripcion:       v.texto(b.descripcion, 'Descripción completa', { max: 1500 }),
    requisitos:        JSON.stringify(v.lista(b.requisitos, 'Requisitos')),
    turnos:            JSON.stringify(v.lista(b.turnos, 'Turnos', { maxItems: 6 })),
    estado:            v.opcion(b.estado, ESTADOS, 'Estado'),
    orden:             v.entero(b.orden, 'Orden', { max: 999 }) ?? 0,
  };
}

function slugUnico(base, idActual = 0) {
  let slug = v.slug(base), i = 2;
  while (db.uno('SELECT id FROM especialidades WHERE slug = ? AND id <> ?', [slug, idActual])) slug = `${v.slug(base)}-${i++}`;
  return slug;
}

router.get('/especialidades', (req, res) => {
  res.json(db.todos('SELECT * FROM especialidades ORDER BY orden, id').map(especialidad));
});

router.post('/especialidades', recibir.single('imagen'), (req, res) => {
  const d = datosEspecialidad(req.body);
  const imagen = req.file ? guardarImagen(req.file, 'especialidades') : null;
  const r = db.ejecutar(
    `INSERT INTO especialidades (slug, nombre, ciclo, duracion, duracion_corta, color, descripcion_corta,
       descripcion, requisitos, turnos, imagen, estado, orden)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slugUnico(d.nombre), d.nombre, d.ciclo, d.duracion, d.duracion_corta, d.color, d.descripcion_corta,
     d.descripcion, d.requisitos, d.turnos, imagen, d.estado, d.orden]);
  res.status(201).json(especialidad(db.uno('SELECT * FROM especialidades WHERE id = ?', [r.id])));
});

router.put('/especialidades/:id', recibir.single('imagen'), (req, res) => {
  const actual = buscar('especialidades', req.params.id, res); if (!actual) return;
  const d = datosEspecialidad(req.body);
  let imagen = actual.imagen;
  if (req.file) { imagen = guardarImagen(req.file, 'especialidades'); borrarImagen(actual.imagen); }
  else if (req.body.quitar_imagen === '1') { borrarImagen(actual.imagen); imagen = null; }
  db.ejecutar(
    `UPDATE especialidades SET nombre=?, ciclo=?, duracion=?, duracion_corta=?, color=?, descripcion_corta=?,
       descripcion=?, requisitos=?, turnos=?, imagen=?, estado=?, orden=?, actualizado=${ahora} WHERE id=?`,
    [d.nombre, d.ciclo, d.duracion, d.duracion_corta, d.color, d.descripcion_corta,
     d.descripcion, d.requisitos, d.turnos, imagen, d.estado, d.orden, actual.id]);
  res.json(especialidad(db.uno('SELECT * FROM especialidades WHERE id = ?', [actual.id])));
});

router.patch('/especialidades/:id/estado', (req, res) => {
  const actual = buscar('especialidades', req.params.id, res); if (!actual) return;
  const estado = v.opcion(req.body.estado, ESTADOS, 'Estado');
  db.ejecutar(`UPDATE especialidades SET estado=?, actualizado=${ahora} WHERE id=?`, [estado, actual.id]);
  res.json({ ok: true, estado });
});

router.delete('/especialidades/:id', (req, res) => {
  const actual = buscar('especialidades', req.params.id, res); if (!actual) return;
  db.ejecutar('DELETE FROM especialidades WHERE id = ?', [actual.id]);
  borrarImagen(actual.imagen);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════════════
   CONVOCATORIAS
   ════════════════════════════════════════════════════════════════ */
function datosConvocatoria(b) {
  const d = {
    titulo:       v.texto(b.titulo, 'Título', { max: 120, requerido: true }),
    descripcion:  v.texto(b.descripcion, 'Descripción', { max: 1500 }),
    fecha_inicio: v.fecha(b.fecha_inicio, 'Fecha de inicio'),
    fecha_fin:    v.fecha(b.fecha_fin, 'Fecha de cierre'),
    vacantes:     v.entero(b.vacantes, 'Vacantes', { max: 5000 }),
    requisitos:   JSON.stringify(v.lista(b.requisitos, 'Requisitos')),
    estado:       v.opcion(b.estado, ESTADOS, 'Estado'),
  };
  if (d.fecha_inicio && d.fecha_fin && d.fecha_fin < d.fecha_inicio) {
    throw new v.ErrorValidacion('La fecha de cierre no puede ser anterior a la de inicio.');
  }
  return d;
}
const convocatoria = (c) => ({ ...c, requisitos: json(c.requisitos) });

router.get('/convocatorias', (req, res) => {
  res.json(db.todos('SELECT * FROM convocatorias ORDER BY COALESCE(fecha_inicio, creado) DESC, id DESC').map(convocatoria));
});

router.post('/convocatorias', (req, res) => {
  const d = datosConvocatoria(req.body);
  const r = db.ejecutar(
    'INSERT INTO convocatorias (titulo, descripcion, fecha_inicio, fecha_fin, vacantes, requisitos, estado) VALUES (?,?,?,?,?,?,?)',
    [d.titulo, d.descripcion, d.fecha_inicio, d.fecha_fin, d.vacantes, d.requisitos, d.estado]);
  res.status(201).json(convocatoria(db.uno('SELECT * FROM convocatorias WHERE id = ?', [r.id])));
});

router.put('/convocatorias/:id', (req, res) => {
  const actual = buscar('convocatorias', req.params.id, res); if (!actual) return;
  const d = datosConvocatoria(req.body);
  db.ejecutar(
    `UPDATE convocatorias SET titulo=?, descripcion=?, fecha_inicio=?, fecha_fin=?, vacantes=?, requisitos=?, estado=?, actualizado=${ahora} WHERE id=?`,
    [d.titulo, d.descripcion, d.fecha_inicio, d.fecha_fin, d.vacantes, d.requisitos, d.estado, actual.id]);
  res.json(convocatoria(db.uno('SELECT * FROM convocatorias WHERE id = ?', [actual.id])));
});

router.delete('/convocatorias/:id', (req, res) => {
  const actual = buscar('convocatorias', req.params.id, res); if (!actual) return;
  db.ejecutar('DELETE FROM convocatorias WHERE id = ?', [actual.id]);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════════════
   NOTICIAS
   ════════════════════════════════════════════════════════════════ */
function datosNoticia(b) {
  return {
    titulo:    v.texto(b.titulo, 'Título', { max: 140, requerido: true }),
    fecha:     v.fecha(b.fecha, 'Fecha', { requerido: true }),
    resumen:   v.texto(b.resumen, 'Resumen', { max: 300 }),
    contenido: v.texto(b.contenido, 'Contenido', { max: 8000 }),
    estado:    v.opcion(b.estado, ESTADOS, 'Estado'),
  };
}

router.get('/noticias', (req, res) => {
  res.json(db.todos('SELECT * FROM noticias ORDER BY fecha DESC, id DESC'));
});

router.post('/noticias', recibir.single('imagen'), (req, res) => {
  const d = datosNoticia(req.body);
  const imagen = req.file ? guardarImagen(req.file, 'noticias') : null;
  const r = db.ejecutar('INSERT INTO noticias (titulo, fecha, resumen, contenido, imagen, estado) VALUES (?,?,?,?,?,?)',
    [d.titulo, d.fecha, d.resumen, d.contenido, imagen, d.estado]);
  res.status(201).json(db.uno('SELECT * FROM noticias WHERE id = ?', [r.id]));
});

router.put('/noticias/:id', recibir.single('imagen'), (req, res) => {
  const actual = buscar('noticias', req.params.id, res); if (!actual) return;
  const d = datosNoticia(req.body);
  let imagen = actual.imagen;
  if (req.file) { imagen = guardarImagen(req.file, 'noticias'); borrarImagen(actual.imagen); }
  else if (req.body.quitar_imagen === '1') { borrarImagen(actual.imagen); imagen = null; }
  db.ejecutar(`UPDATE noticias SET titulo=?, fecha=?, resumen=?, contenido=?, imagen=?, estado=?, actualizado=${ahora} WHERE id=?`,
    [d.titulo, d.fecha, d.resumen, d.contenido, imagen, d.estado, actual.id]);
  res.json(db.uno('SELECT * FROM noticias WHERE id = ?', [actual.id]));
});

router.delete('/noticias/:id', (req, res) => {
  const actual = buscar('noticias', req.params.id, res); if (!actual) return;
  db.ejecutar('DELETE FROM noticias WHERE id = ?', [actual.id]);
  borrarImagen(actual.imagen);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════════════
   GALERÍA
   ════════════════════════════════════════════════════════════════ */
const idEspecialidad = (valor) => {
  const id = v.entero(valor, 'Especialidad', { min: 1, max: 1e9 });
  if (id && !db.uno('SELECT id FROM especialidades WHERE id = ?', [id])) throw new v.ErrorValidacion('La especialidad no existe.');
  return id;
};

router.get('/galeria', (req, res) => {
  res.json(db.todos(`SELECT g.*, e.nombre AS especialidad FROM galeria g
    LEFT JOIN especialidades e ON e.id = g.especialidad_id ORDER BY g.id DESC`));
});

router.post('/galeria', recibir.array('imagenes', 10), (req, res) => {
  if (!req.files?.length) throw new v.ErrorValidacion('Selecciona al menos una imagen.');
  const titulo = v.texto(req.body.titulo, 'Título', { max: 120 });
  const espId = idEspecialidad(req.body.especialidad_id);
  const rutas = req.files.map(f => guardarImagen(f, 'galeria')); // valida todas antes de insertar
  rutas.forEach(ruta => db.ejecutar('INSERT INTO galeria (archivo, titulo, especialidad_id) VALUES (?,?,?)', [ruta, titulo, espId]));
  res.status(201).json({ ok: true, subidas: rutas.length });
});

router.put('/galeria/:id', (req, res) => {
  const actual = buscar('galeria', req.params.id, res); if (!actual) return;
  db.ejecutar('UPDATE galeria SET titulo=?, especialidad_id=? WHERE id=?',
    [v.texto(req.body.titulo, 'Título', { max: 120 }), idEspecialidad(req.body.especialidad_id), actual.id]);
  res.json({ ok: true });
});

router.delete('/galeria/:id', (req, res) => {
  const actual = buscar('galeria', req.params.id, res); if (!actual) return;
  db.ejecutar('DELETE FROM galeria WHERE id = ?', [actual.id]);
  borrarImagen(actual.archivo);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════════════
   CONTACTOS (consultas recibidas)
   ════════════════════════════════════════════════════════════════ */
router.get('/consultas', (req, res) => {
  res.json(db.todos('SELECT * FROM consultas ORDER BY id DESC'));
});

router.patch('/consultas/:id', (req, res) => {
  const actual = buscar('consultas', req.params.id, res); if (!actual) return;
  db.ejecutar('UPDATE consultas SET leido = ? WHERE id = ?', [req.body.leido ? 1 : 0, actual.id]);
  res.json({ ok: true });
});

router.delete('/consultas/:id', (req, res) => {
  const actual = buscar('consultas', req.params.id, res); if (!actual) return;
  db.ejecutar('DELETE FROM consultas WHERE id = ?', [actual.id]);
  res.json({ ok: true });
});

/* ════════════════════════════════════════════════════════════════
   CONFIGURACIÓN Y PÁGINA DE INICIO
   ════════════════════════════════════════════════════════════════ */
const CAMPOS_CONFIG = {
  institucion_nombre:      (x) => v.texto(x, 'Nombre de la institución', { max: 100, requerido: true }),
  direccion:               (x) => v.texto(x, 'Dirección', { max: 120 }),
  distrito:                (x) => v.texto(x, 'Ciudad / región', { max: 120 }),
  maps_url:                (x) => v.url(x, 'Enlace de Google Maps'),
  telefono_fijo:           (x) => v.texto(x, 'Teléfono fijo', { max: 30 }),
  telefono_fijo_etiqueta:  (x) => v.texto(x, 'Etiqueta del teléfono fijo', { max: 40 }),
  celular:                 (x) => v.texto(x, 'Celular', { max: 30 }),
  celular_etiqueta:        (x) => v.texto(x, 'Etiqueta del celular', { max: 40 }),
  correo:                  (x) => {
    const c = v.texto(x, 'Correo', { max: 120 });
    if (c && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) throw new v.ErrorValidacion('El correo no es válido.');
    return c;
  },
  horario_dias:            (x) => v.texto(x, 'Días de atención', { max: 60 }),
  horario_manana:          (x) => v.texto(x, 'Horario de mañana', { max: 60 }),
  horario_tarde:           (x) => v.texto(x, 'Horario de tarde', { max: 60 }),
  whatsapp:                (x) => {
    const w = v.texto(x, 'WhatsApp', { max: 15 }).replace(/\D/g, '');
    if (w && !/^51\d{9}$/.test(w)) throw new v.ErrorValidacion('El WhatsApp debe tener 51 + 9 dígitos (ej.: 51987654321).');
    return w;
  },
  facebook:                (x) => v.url(x, 'Facebook'),
  youtube:                 (x) => v.url(x, 'YouTube'),
  youtube_video:           (x) => {
    const id = v.texto(x, 'Video de YouTube', { max: 20 });
    if (id && !/^[\w-]{6,20}$/.test(id)) throw new v.ErrorValidacion('El ID del video solo lleva letras, números, - y _.');
    return id;
  },
  inicio_eyebrow:          (x) => v.texto(x, 'Etiqueta superior', { max: 80 }),
  inicio_titulo:           (x) => v.texto(x, 'Título', { max: 80, requerido: true }),
  inicio_titulo_destacado: (x) => v.texto(x, 'Título destacado', { max: 80 }),
  inicio_lead:             (x) => v.texto(x, 'Texto de presentación', { max: 320 }),
  inicio_boton:            (x) => v.texto(x, 'Texto del botón', { max: 40, requerido: true }),
};

router.get('/configuracion', (req, res) => {
  const cfg = {};
  db.todos('SELECT clave, valor FROM configuracion').forEach(f => { cfg[f.clave] = f.valor; });
  res.json(cfg);
});

router.put('/configuracion', (req, res) => {
  const cambios = Object.entries(req.body || {}).filter(([k]) => k in CAMPOS_CONFIG);
  if (!cambios.length) throw new v.ErrorValidacion('No hay cambios para guardar.');
  const limpios = cambios.map(([k, val]) => [k, CAMPOS_CONFIG[k](val)]); // valida todo antes de guardar
  limpios.forEach(([k, val]) => db.ejecutar(
    'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', [k, val]));
  res.json({ ok: true });
});

module.exports = router;
