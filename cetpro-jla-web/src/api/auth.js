/**
 * API de autenticación: /api/auth/*
 */
'use strict';

const express = require('express');
const db = require('../../database/db');
const auth = require('../utils/auth');
const v = require('../utils/validar');

const router = express.Router();

const limiteLogin = auth.limitador({
  max: 5, ventanaMin: 15,
  mensaje: 'Demasiados intentos. Espera 15 minutos e inténtalo otra vez.',
});

// Hash ficticio para comparar en tiempo constante cuando el usuario no existe
const HASH_FICTICIO = auth.hashClave('no-existe-' + Date.now());

const publico = (u) => ({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, acceso_anterior: u.acceso_anterior });

router.post('/login', auth.antiCSRF, limiteLogin, (req, res) => {
  const usuario = v.texto(req.body.usuario, 'Usuario', { max: 40, requerido: true }).toLowerCase();
  const clave = (req.body.clave ?? '').toString();
  const u = db.uno('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
  const ok = auth.verificarClave(clave, u ? u.clave_hash : HASH_FICTICIO) && !!u;
  if (!ok) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

  limiteLogin.reiniciar(req);
  auth.crearSesion(res, u.id);
  db.ejecutar(`UPDATE usuarios SET acceso_anterior = ultimo_acceso, ultimo_acceso = datetime('now','localtime') WHERE id = ?`, [u.id]);
  res.json({ usuario: publico(u) });
});

router.post('/logout', auth.antiCSRF, (req, res) => {
  auth.cerrarSesion(req, res);
  res.json({ ok: true });
});

router.get('/yo', auth.requiereSesion, (req, res) => {
  const u = db.uno('SELECT * FROM usuarios WHERE id = ?', [req.sesion.usuarioId]);
  if (!u) return res.status(401).json({ error: 'Usuario no encontrado.' });
  res.json({ usuario: publico(u) });
});

router.post('/clave', auth.requiereSesion, auth.antiCSRF, limiteLogin, (req, res) => {
  const { actual = '', nueva = '' } = req.body;
  const u = db.uno('SELECT * FROM usuarios WHERE id = ?', [req.sesion.usuarioId]);
  if (!u || !auth.verificarClave(actual, u.clave_hash)) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
  }
  if (String(nueva).length < 10) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 10 caracteres.' });
  }
  db.ejecutar('UPDATE usuarios SET clave_hash = ? WHERE id = ?', [auth.hashClave(String(nueva)), u.id]);
  auth.cerrarSesionesDe(u.id, req.sesion.token);
  limiteLogin.reiniciar(req);
  res.json({ ok: true });
});

module.exports = router;
