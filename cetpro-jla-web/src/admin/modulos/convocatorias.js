/** ADMISIÓN / CONVOCATORIAS — la vigente se muestra como banner en la portada. */
import { api } from '/components/api.js';
import {
  html, ico, campo, campoEstado, abrirModal, confirmar, toast, activarFormulario,
  alEnviar, pildoraEstado, vacio, cabeceraTarjeta, fecha, hoy,
} from '/components/ui.js';

let lista = [];

export async function render(cont, ctx) {
  lista = await api('/api/admin/convocatorias');
  pintar(cont);
  if (ctx.accion === 'nueva') {
    history.replaceState(null, '', '#/convocatorias');
    formulario(cont);
  }
}

/** La misma regla que usa la web: publicada y sin cerrar; gana la más reciente. */
function vigenteId() {
  const h = hoy();
  const v = lista
    .filter(c => c.estado === 'publicado' && (!c.fecha_fin || c.fecha_fin >= h))
    .sort((a, b) => (b.fecha_inicio || b.creado).localeCompare(a.fecha_inicio || a.creado))[0];
  return v?.id;
}

function pintar(cont) {
  const vigente = vigenteId();
  cont.innerHTML = String(html`
    <section class="tarjeta">
      ${cabeceraTarjeta({
        titulo: 'Convocatorias de admisión',
        subtitulo: 'La convocatoria vigente aparece como banner debajo de las carreras',
        acciones: html`<button type="button" class="btn btn--pri" data-nueva>${ico('mas', 18)} Nueva convocatoria</button>`,
      })}
      ${lista.length ? html`
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th scope="col">Convocatoria</th><th scope="col">Fechas</th><th scope="col">Vacantes</th><th scope="col">Estado</th><th scope="col" class="tabla__acciones-th">Acciones</th></tr></thead>
            <tbody>
              ${lista.map(c => html`
                <tr>
                  <td data-titulo="Convocatoria"><strong>${c.titulo}</strong>
                    ${c.id === vigente ? html`<span class="pildora pildora--azul">${ico('megafono', 13)} En la web ahora</span>` : ''}</td>
                  <td data-titulo="Fechas">${c.fecha_inicio ? fecha(c.fecha_inicio) : '—'} → ${c.fecha_fin ? fecha(c.fecha_fin) : 'sin cierre'}
                    ${c.fecha_fin && c.fecha_fin < hoy() ? html`<small class="tabla__sub">Cerrada</small>` : ''}</td>
                  <td data-titulo="Vacantes">${c.vacantes ?? '—'}</td>
                  <td data-titulo="Estado">${pildoraEstado(c.estado)}</td>
                  <td class="tabla__acciones">
                    <button type="button" class="btn-accion btn-accion--azul" data-editar="${c.id}" aria-label="Editar ${c.titulo}" title="Editar">${ico('lapiz', 17)}</button>
                    <button type="button" class="btn-accion btn-accion--rojo" data-borrar="${c.id}" aria-label="Eliminar ${c.titulo}" title="Eliminar">${ico('basura', 17)}</button>
                  </td>
                </tr>`)}
            </tbody>
          </table>
        </div>` : vacio({
          icono: 'megafono', titulo: 'No hay convocatorias',
          texto: 'Crea la convocatoria de admisión: fechas, vacantes y requisitos. Al publicarla aparece en la portada.',
        })}
    </section>`);

  cont.querySelector('[data-nueva]').addEventListener('click', () => formulario(cont));
  cont.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () =>
    formulario(cont, lista.find(c => c.id === Number(b.dataset.editar)))));
  cont.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', async () => {
    const c = lista.find(x => x.id === Number(b.dataset.borrar));
    if (!await confirmar(`Se eliminará la convocatoria «${c.titulo}».`)) return;
    try {
      await api(`/api/admin/convocatorias/${c.id}`, { metodo: 'DELETE' });
      lista = lista.filter(x => x.id !== c.id);
      toast('Convocatoria eliminada.');
      pintar(cont);
    } catch (err) { toast(err.message, 'error'); }
  }));
}

function formulario(cont, c = null) {
  const nuevo = !c;
  c = c || { titulo: `Convocatoria de Admisión ${new Date().getFullYear() + (new Date().getMonth() > 8 ? 1 : 0)}`,
             descripcion: '', fecha_inicio: hoy(), fecha_fin: '', vacantes: '', requisitos: [], estado: 'borrador' };

  const { d, cerrar } = abrirModal({
    titulo: nuevo ? 'Nueva convocatoria' : 'Editar convocatoria',
    ancho: 'lg',
    cuerpo: html`
      <form id="form-convocatoria" class="formulario" novalidate>
        ${campo({ etiqueta: 'Título', nombre: 'titulo', valor: c.titulo, max: 120, requerido: true, ancho: 'completo' })}
        ${campo({ etiqueta: 'Inicio de inscripciones', nombre: 'fecha_inicio', tipo: 'date', valor: c.fecha_inicio })}
        ${campo({ etiqueta: 'Cierre de inscripciones', nombre: 'fecha_fin', tipo: 'date', valor: c.fecha_fin, ayuda: 'Después de esta fecha el banner se oculta solo' })}
        ${campo({ etiqueta: 'Vacantes', nombre: 'vacantes', tipo: 'number', valor: c.vacantes, min: 0 })}
        <div></div>
        ${campo({ etiqueta: 'Descripción', nombre: 'descripcion', tipo: 'textarea', valor: c.descripcion, max: 1500, filas: 4, ancho: 'completo' })}
        ${campo({ etiqueta: 'Requisitos', nombre: 'requisitos', tipo: 'textarea', valor: c.requisitos.join('\n'), filas: 4, ancho: 'completo', ayuda: 'Uno por línea' })}
        ${campoEstado(c.estado)}
      </form>`,
    pie: html`
      <button type="button" class="btn btn--sec" data-cerrar>Cancelar</button>
      <button type="submit" form="form-convocatoria" class="btn btn--pri">${ico('guardar', 18)} Guardar</button>`,
  });

  const form = d.querySelector('form');
  activarFormulario(form);
  alEnviar(form, async (fd) => {
    const datos = Object.fromEntries(fd);
    const g = await api(nuevo ? '/api/admin/convocatorias' : `/api/admin/convocatorias/${c.id}`,
      { metodo: nuevo ? 'POST' : 'PUT', datos });
    lista = nuevo ? [g, ...lista] : lista.map(x => (x.id === g.id ? g : x));
    cerrar();
    toast(g.estado === 'publicado' ? 'Convocatoria publicada.' : 'Convocatoria guardada como borrador.');
    pintar(cont);
  });
}
