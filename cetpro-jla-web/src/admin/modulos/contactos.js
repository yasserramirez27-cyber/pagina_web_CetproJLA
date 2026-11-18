/** CONTACTOS — consultas que llegan desde el formulario de la web. */
import { api } from '/components/api.js';
import { html, ico, confirmar, toast, vacio, cabeceraTarjeta, fecha } from '/components/ui.js';

let lista = [];
let vista = 'todas';

export async function render(cont, ctx) {
  lista = await api('/api/admin/consultas');
  pintar(cont, ctx);
}

const enlaceContacto = (c) => {
  if (c.includes('@')) return html`<a href="mailto:${c}">${ico('correo', 15)} ${c}</a>`;
  const num = c.replace(/\D/g, '');
  const intl = num.length === 9 ? '51' + num : num;
  return html`<a href="tel:+${intl}">${ico('telefono', 15)} ${c}</a>
    <a href="https://wa.me/${intl}" target="_blank" rel="noopener noreferrer">${ico('mensaje', 15)} WhatsApp</a>`;
};

function pintar(cont, ctx) {
  const sinLeer = lista.filter(c => !c.leido).length;
  const visibles = vista === 'sin-leer' ? lista.filter(c => !c.leido) : lista;

  cont.innerHTML = String(html`
    <section class="tarjeta">
      ${cabeceraTarjeta({ titulo: 'Consultas recibidas', subtitulo: 'Responde y elimina las ya atendidas: así no se acumulan datos personales' })}
      <div class="pestanas" role="tablist">
        <button type="button" role="tab" aria-selected="${vista === 'todas'}" data-vista="todas">Todas <span>${lista.length}</span></button>
        <button type="button" role="tab" aria-selected="${vista === 'sin-leer'}" data-vista="sin-leer">Sin leer <span>${sinLeer}</span></button>
      </div>
      ${visibles.length ? html`
        <ul class="consultas">
          ${visibles.map(c => html`
            <li class="consulta-item ${c.leido ? '' : 'consulta-item--nueva'}">
              <div class="consulta-item__cabecera">
                <span class="avatar" aria-hidden="true">${c.nombre.trim()[0]?.toUpperCase()}</span>
                <div>
                  <strong>${c.nombre}</strong>
                  <small>${fecha(c.creado, true)}${c.especialidad ? html` · Interés: <b>${c.especialidad}</b>` : ''}</small>
                </div>
                ${c.leido ? '' : html`<span class="pildora pildora--naranja">Nueva</span>`}
              </div>
              <p class="consulta-item__mensaje">${c.mensaje}</p>
              <div class="consulta-item__pie">
                <span class="consulta-item__contacto">${enlaceContacto(c.contacto)}</span>
                <span class="consulta-item__acciones">
                  <button type="button" class="btn btn--sec btn--sm" data-leido="${c.id}">
                    ${ico(c.leido ? 'correo' : 'checks', 16)} ${c.leido ? 'Marcar como no leída' : 'Marcar como atendida'}</button>
                  <button type="button" class="btn-accion btn-accion--rojo" data-borrar="${c.id}" title="Eliminar" aria-label="Eliminar consulta de ${c.nombre}">${ico('basura', 17)}</button>
                </span>
              </div>
            </li>`)}
        </ul>` : vacio({
          icono: 'correo',
          titulo: vista === 'sin-leer' ? '¡Todo al día!' : 'Sin consultas todavía',
          texto: vista === 'sin-leer' ? 'No hay consultas pendientes.' : 'Las consultas del formulario «Déjanos tu consulta» de la web llegarán aquí.',
        })}
    </section>`);

  cont.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => { vista = b.dataset.vista; pintar(cont, ctx); }));

  cont.querySelectorAll('[data-leido]').forEach(b => b.addEventListener('click', async () => {
    const c = lista.find(x => x.id === Number(b.dataset.leido));
    try {
      await api(`/api/admin/consultas/${c.id}`, { metodo: 'PATCH', datos: { leido: !c.leido } });
      c.leido = c.leido ? 0 : 1;
      pintar(cont, ctx);
      ctx.refrescarAvisos();
    } catch (err) { toast(err.message, 'error'); }
  }));

  cont.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', async () => {
    const c = lista.find(x => x.id === Number(b.dataset.borrar));
    if (!await confirmar(`Se eliminará la consulta de ${c.nombre} con sus datos de contacto.`)) return;
    try {
      await api(`/api/admin/consultas/${c.id}`, { metodo: 'DELETE' });
      lista = lista.filter(x => x.id !== c.id);
      toast('Consulta eliminada.');
      pintar(cont, ctx);
      ctx.refrescarAvisos();
    } catch (err) { toast(err.message, 'error'); }
  }));
}
