/**
 * Crea un usuario del panel o cambia su contraseña.
 * Uso:  npm run crear-admin -- <usuario> <contraseña> ["Nombre completo"]
 * Ej.:  npm run crear-admin -- admin MiClaveSegura2026 "Yasser Ramírez"
 */
'use strict';

const db = require('./db');
const { hashClave } = require('../src/utils/auth');

(async () => {
  const [usuario, clave, nombre = 'Administrador'] = process.argv.slice(2);
  if (!usuario || !clave) {
    console.log('Uso: npm run crear-admin -- <usuario> <contraseña> ["Nombre completo"]');
    process.exit(1);
  }
  if (clave.length < 10) {
    console.log('✘ La contraseña debe tener al menos 10 caracteres.');
    process.exit(1);
  }
  await db.conectar();
  const u = usuario.toLowerCase();
  if (db.uno('SELECT id FROM usuarios WHERE usuario = ?', [u])) {
    db.ejecutar('UPDATE usuarios SET clave_hash = ?, nombre = ? WHERE usuario = ?', [hashClave(clave), nombre, u]);
    console.log(`✔ Contraseña de «${u}» actualizada. Reinicia el servidor para cerrar sesiones abiertas.`);
  } else {
    db.ejecutar('INSERT INTO usuarios (usuario, nombre, clave_hash) VALUES (?, ?, ?)', [u, nombre, hashClave(clave)]);
    console.log(`✔ Usuario «${u}» creado.`);
  }
  process.exit(0);
})();
