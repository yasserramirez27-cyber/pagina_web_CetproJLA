/** CONFIGURACIÓN — datos de contacto, redes, WhatsApp y cambio de contraseña. */
import { api } from '/components/api.js';
import { html, ico, campo, toast, activarFormulario, alEnviar, cabeceraTarjeta } from '/components/ui.js';

export async function render(cont) {
  const cfg = await api('/api/admin/configuracion');
  const ejemplo = cfg.whatsapp === '51900000000';

  cont.innerHTML = String(html`
    <form id="form-config" novalidate>
      <section class="tarjeta">
        ${cabeceraTarjeta({ titulo: 'Datos de la institución', subtitulo: 'Se muestran en Contacto, el pie de página y la ficha de matrícula' })}
        <div class="formulario">
          ${campo({ etiqueta: 'Nombre de la institución', nombre: 'institucion_nombre', valor: cfg.institucion_nombre, max: 100, requerido: true })}
          ${campo({ etiqueta: 'Correo institucional', nombre: 'correo', tipo: 'email', valor: cfg.correo, max: 120 })}
          ${campo({ etiqueta: 'Dirección', nombre: 'direccion', valor: cfg.direccion, max: 120 })}
          ${campo({ etiqueta: 'Ciudad / región', nombre: 'distrito', valor: cfg.distrito, max: 120 })}
          ${campo({ etiqueta: 'Enlace de Google Maps', nombre: 'maps_url', tipo: 'url', valor: cfg.maps_url, max: 300, ancho: 'completo' })}
        </div>
      </section>

      <section class="tarjeta">
        ${cabeceraTarjeta({ titulo: 'Teléfonos y horario' })}
        <div class="formulario">
          ${campo({ etiqueta: 'Teléfono fijo', nombre: 'telefono_fijo', valor: cfg.telefono_fijo, max: 30 })}
          ${campo({ etiqueta: 'Etiqueta del fijo', nombre: 'telefono_fijo_etiqueta', valor: cfg.telefono_fijo_etiqueta, max: 40 })}
          ${campo({ etiqueta: 'Celular', nombre: 'celular', valor: cfg.celular, max: 30 })}
          ${campo({ etiqueta: 'Etiqueta del celular', nombre: 'celular_etiqueta', valor: cfg.celular_etiqueta, max: 40 })}
          ${campo({ etiqueta: 'Días de atención', nombre: 'horario_dias', valor: cfg.horario_dias, max: 60 })}
          <div></div>
          ${campo({ etiqueta: 'Horario mañana', nombre: 'horario_manana', valor: cfg.horario_manana, max: 60 })}
          ${campo({ etiqueta: 'Horario tarde', nombre: 'horario_tarde', valor: cfg.horario_tarde, max: 60 })}
        </div>
      </section>

      <section class="tarjeta">
        ${cabeceraTarjeta({ titulo: 'WhatsApp y redes sociales' })}
        ${ejemplo ? html`<div class="alerta alerta--aviso">${ico('alerta', 20)}
          <p><strong>Número de ejemplo.</strong> Verifica con Dirección el WhatsApp institucional antes de recibir matrículas (ver AUDITORIA_SEGURIDAD.md, hallazgo 3).</p></div>` : ''}
        <div class="formulario">
          ${campo({ etiqueta: 'WhatsApp (con 51)', nombre: 'whatsapp', valor: cfg.whatsapp, max: 15, ayuda: 'Ej.: 51987654321 · Lo usan el botón flotante y la ficha de matrícula' })}
          ${campo({ etiqueta: 'ID de video de YouTube', nombre: 'youtube_video', valor: cfg.youtube_video, max: 20, ayuda: 'Lo que va después de «v=» en el enlace. Vacío = sin video' })}
          ${campo({ etiqueta: 'Página de Facebook', nombre: 'facebook', tipo: 'url', valor: cfg.facebook, max: 300 })}
          ${campo({ etiqueta: 'Canal de YouTube', nombre: 'youtube', tipo: 'url', valor: cfg.youtube, max: 300 })}
        </div>
      </section>

      <div class="barra-guardar">
        <span>Los cambios se aplican en la web al guardar.</span>
        <button type="submit" class="btn btn--pri">${ico('guardar', 18)} Guardar configuración</button>
      </div>
    </form>

    <section class="tarjeta">
      ${cabeceraTarjeta({ titulo: 'Seguridad', subtitulo: 'Cambia la contraseña del panel. Las demás sesiones abiertas se cerrarán.' })}
      <form id="form-clave" class="formulario" novalidate>
        <input type="text" name="usuario" autocomplete="username" hidden>
        ${campo({ etiqueta: 'Contraseña actual', nombre: 'actual', tipo: 'password', requerido: true, extra: 'autocomplete="current-password"' })}
        <div></div>
        ${campo({ etiqueta: 'Nueva contraseña', nombre: 'nueva', tipo: 'password', requerido: true, extra: 'autocomplete="new-password" minlength="10"', ayuda: 'Mínimo 10 caracteres. Una frase es más segura: «retablo-ayacucho-2026»' })}
        ${campo({ etiqueta: 'Repite la nueva contraseña', nombre: 'repetir', tipo: 'password', requerido: true, extra: 'autocomplete="new-password" minlength="10"' })}
        <div class="formulario__acciones campo--completo">
          <button type="submit" class="btn btn--sec">${ico('candado', 18)} Cambiar contraseña</button>
        </div>
      </form>
    </section>`);

  const form = cont.querySelector('#form-config');
  activarFormulario(form);
  alEnviar(form, async (fd) => {
    await api('/api/admin/configuracion', { metodo: 'PUT', datos: Object.fromEntries(fd) });
    toast('Configuración guardada. La web ya muestra los nuevos datos.');
  });

  const formClave = cont.querySelector('#form-clave');
  alEnviar(formClave, async (fd) => {
    if (fd.get('nueva') !== fd.get('repetir')) throw new Error('Las contraseñas nuevas no coinciden.');
    await api('/api/auth/clave', { metodo: 'POST', datos: { actual: fd.get('actual'), nueva: fd.get('nueva') } });
    formClave.reset();
    toast('Contraseña actualizada.');
  });
}
