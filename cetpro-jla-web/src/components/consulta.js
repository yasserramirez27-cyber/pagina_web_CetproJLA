/**
 * ================================================================
 * FORMULARIO DE CONSULTAS (web pública)
 * Envía la consulta por POST al servidor; aparece en el panel →
 * Contactos. El botón queda deshabilitado hasta que este script
 * carga, así nunca se envían datos por la URL.
 * ================================================================
 */
'use strict';

(() => {
  const form = document.getElementById('form-consulta');
  if (!form) return;

  const boton  = form.querySelector('button[type="submit"]');
  const estado = document.getElementById('consulta-estado');
  boton.disabled = false;

  const avisar = (texto, tipo) => {
    estado.textContent = texto;
    estado.dataset.tipo = tipo;
  };

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    datos.acepta = form.elements.acepta.checked;

    if (!datos.nombre.trim() || !datos.contacto.trim() || !datos.mensaje.trim()) {
      return avisar('Completa tu nombre, un celular o correo y tu consulta.', 'error');
    }
    if (!datos.acepta) return avisar('Marca la casilla para aceptar el uso de tus datos.', 'error');

    boton.disabled = true;
    avisar('Enviando…', 'info');
    try {
      const resp = await fetch('/api/consultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json.error || 'No se pudo enviar.');
      form.reset();
      avisar('¡Gracias! Recibimos tu consulta. Secretaría te contactará pronto.', 'ok');
    } catch (err) {
      avisar(err.message === 'Failed to fetch' ? 'Sin conexión. Inténtalo de nuevo.' : err.message, 'error');
    } finally {
      boton.disabled = false;
    }
  });
})();
