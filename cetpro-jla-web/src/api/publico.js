/**
 * API pública: lo único que un visitante puede enviar es una consulta.
 */
'use strict';

const express = require('express');
const db = require('../../database/db');
const { limitador } = require('../utils/auth');
const v = require('../utils/validar');

const router = express.Router();

const limiteConsultas = limitador({
  max: 5, ventanaMin: 60,
  mensaje: 'Ya recibimos varias consultas desde tu conexión. Inténtalo más tarde o llámanos.',
});

router.post('/consultas', limiteConsultas, (req, res) => {
  const b = req.body || {};
  // Campo trampa: los robots lo llenan, las personas no lo ven
  if (b.sitio_web) return res.json({ ok: true });

  const nombre   = v.texto(b.nombre, 'Nombre', { max: 80, requerido: true });
  const contacto = v.texto(b.contacto, 'Celular o correo', { max: 120, requerido: true });
  const mensaje  = v.texto(b.mensaje, 'Mensaje', { max: 1000, requerido: true });
  const especialidad = v.texto(b.especialidad, 'Carrera', { max: 80 });

  const esCelular = /^\+?\d[\d\s-]{6,14}$/.test(contacto);
  const esCorreo  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contacto);
  if (!esCelular && !esCorreo) {
    return res.status(400).json({ error: 'Escribe un celular (9 dígitos) o un correo válido.' });
  }
  if (b.acepta !== true) {
    return res.status(400).json({ error: 'Debes aceptar el uso de tus datos para responder la consulta.' });
  }

  db.ejecutar(
    'INSERT INTO consultas (nombre, contacto, especialidad, mensaje) VALUES (?, ?, ?, ?)',
    [nombre, contacto, especialidad || null, mensaje]);
  res.status(201).json({ ok: true });
});

module.exports = router;
