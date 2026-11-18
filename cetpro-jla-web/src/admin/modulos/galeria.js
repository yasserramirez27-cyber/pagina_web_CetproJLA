/** GALERÍA — subir fotos (arrastrar y soltar), asociarlas a una carrera, editar y borrar. */
import { api } from '/components/api.js';
import { html, crudo, ico, campo, abrirModal, confirmar, toast, vacio, cabeceraTarjeta, alEnviar } from '/components/ui.js';

let fotos = [];
let especialidades = [];
let filtro = '';

export async function render(cont, ctx) {
  [fotos, especialidades] = await Promise.all([api('/api/admin/galeria'), api('/api/admin/especialidades')]);

  cont.innerHTML = String(html`
    <section class="tarjeta">
      ${cabeceraTarjeta({ titulo: 'Subir imágenes', subtitulo: 'Las fotos aparecen en «Así se vive en nuestros talleres» y en «Ver detalles» de su carrera' })}
      <form id="form-subir" class="subida" novalidate>
        <label class="subida__zona" id="zona">
          <input type="file" name="imagenes" accept="image/jpeg,image/png,image/webp" multiple hidden>
          <span class="subida__icono">${ico('subir', 30)}</span>
          <strong>Arrastra fotos aquí o haz clic para elegir</strong>
          <small>Hasta 10 a la vez · JPG, PNG o WEBP · máx. 3 MB cada una</small>
          <span class="subida__elegidas" id="elegidas"></span>
        </label>
        <div class="subida__datos">
          ${campo({ etiqueta: 'Título (opcional)', nombre: 'titulo', max: 120, placeholder: 'Ej.: Práctica de soldadura' })}
          ${campo({ etiqueta: 'Carrera', nombre: 'especialidad_id', tipo: 'select', valor: '', opciones: [['', '— General —'], ...especialidades.map(e => [e.id, e.nombre])] })}
          <button type="submit" class="btn btn--pri" disabled>${ico('subir', 18)} Subir fotos</button>
        </div>
      </form>
    </section>

    <section class="tarjeta">
      ${cabeceraTarjeta({
        titulo: 'Fotos publicadas',
        subtitulo: 'Toda foto subida se ve en la web: no subas imágenes de menores sin autorización',
        acciones: crudo(`<select id="filtro-galeria" aria-label="Filtrar por carrera"><option value="">Todas las carreras</option>${
          especialidades.map(e => `<option value="${e.id}">${String(html`${e.nombre}`)}</option>`).join('')}<option value="general">General</option></select>`),
      })}
      <div id="rejilla-fotos"></div>
    </section>`);

  const form = cont.querySelector('#form-subir');
  const input = form.elements.imagenes;
  const zona = cont.querySelector('#zona');
  const boton = form.querySelector('[type=submit]');

  const mostrarElegidas = () => {
    const n = input.files.length;
    cont.querySelector('#elegidas').textContent = n ? `${n} foto${n > 1 ? 's' : ''} lista${n > 1 ? 's' : ''} para subir` : '';
    zona.classList.toggle('subida__zona--lista', n > 0);
    boton.disabled = n === 0;
  };
  input.addEventListener('change', mostrarElegidas);
  ['dragenter', 'dragover'].forEach(ev => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add('subida__zona--encima'); }));
  ['dragleave', 'drop'].forEach(ev => zona.addEventListener(ev, () => zona.classList.remove('subida__zona--encima')));
  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    const dt = new DataTransfer();
    [...e.dataTransfer.files].filter(f => /^image\/(jpeg|png|webp)$/.test(f.type)).slice(0, 10).forEach(f => dt.items.add(f));
    input.files = dt.files;
    mostrarElegidas();
  });

  alEnviar(form, async (fd) => {
    if (!input.files.length) throw new Error('Elige al menos una foto.');
    const pesadas = [...input.files].filter(f => f.size > 3 * 1024 * 1024).map(f => f.name);
    if (pesadas.length) throw new Error(`Pesan más de 3 MB: ${pesadas.join(', ')}. Comprímelas en squoosh.app`);
    const r = await api('/api/admin/galeria', { metodo: 'POST', formData: fd });
    toast(`${r.subidas} foto${r.subidas > 1 ? 's' : ''} subida${r.subidas > 1 ? 's' : ''} a la web.`);
    form.reset();
    mostrarElegidas();
    fotos = await api('/api/admin/galeria');
    pintarRejilla(cont);
  });

  const sel = cont.querySelector('#filtro-galeria');
  sel.value = filtro;
  sel.addEventListener('change', () => { filtro = sel.value; pintarRejilla(cont); });
  pintarRejilla(cont);

  if (ctx.accion === 'subir') {
    history.replaceState(null, '', '#/galeria');
    input.click();
  }
}

function pintarRejilla(cont) {
  const visibles = fotos.filter(f => !filtro || (filtro === 'general' ? !f.especialidad_id : f.especialidad_id === Number(filtro)));
  const caja = cont.querySelector('#rejilla-fotos');
  if (!fotos.length) {
    caja.innerHTML = String(vacio({ icono: 'imagen', titulo: 'La galería está vacía', texto: 'Sube fotos de los talleres: el mural de la portada aparecerá solo.' }));
    return;
  }
  caja.innerHTML = String(html`
    <ul class="galeria-admin">
      ${visibles.map(f => html`
        <li class="galeria-admin__item">
          <img src="${f.archivo}" alt="${f.titulo || 'Foto de la galería'}" loading="lazy">
          <div class="galeria-admin__pie">
            <span><strong>${f.titulo || 'Sin título'}</strong><small>${f.especialidad || 'General'}</small></span>
            <span class="galeria-admin__acciones">
              <button type="button" class="btn-accion btn-accion--azul" data-editar="${f.id}" title="Editar" aria-label="Editar foto">${ico('lapiz', 16)}</button>
              <button type="button" class="btn-accion btn-accion--rojo" data-borrar="${f.id}" title="Eliminar" aria-label="Eliminar foto">${ico('basura', 16)}</button>
            </span>
          </div>
        </li>`)}
    </ul>
    ${visibles.length ? '' : html`<p class="texto-suave">No hay fotos para esta carrera.</p>`}`);

  caja.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', async () => {
    if (!await confirmar('La foto se quitará de la web y se borrará del servidor.')) return;
    try {
      await api(`/api/admin/galeria/${b.dataset.borrar}`, { metodo: 'DELETE' });
      fotos = fotos.filter(f => f.id !== Number(b.dataset.borrar));
      toast('Foto eliminada.');
      pintarRejilla(cont);
    } catch (err) { toast(err.message, 'error'); }
  }));

  caja.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => {
    const f = fotos.find(x => x.id === Number(b.dataset.editar));
    const { d, cerrar } = abrirModal({
      titulo: 'Editar foto', ancho: 'sm',
      cuerpo: html`
        <img class="modal__imagen" src="${f.archivo}" alt="">
        <form id="form-foto" class="formulario formulario--una" novalidate>
          ${campo({ etiqueta: 'Título', nombre: 'titulo', valor: f.titulo, max: 120 })}
          ${campo({ etiqueta: 'Carrera', nombre: 'especialidad_id', tipo: 'select', valor: f.especialidad_id ?? '', opciones: [['', '— General —'], ...especialidades.map(e => [e.id, e.nombre])] })}
        </form>`,
      pie: html`<button type="button" class="btn btn--sec" data-cerrar>Cancelar</button>
                <button type="submit" form="form-foto" class="btn btn--pri">Guardar</button>`,
    });
    alEnviar(d.querySelector('form'), async (fd) => {
      await api(`/api/admin/galeria/${f.id}`, { metodo: 'PUT', datos: Object.fromEntries(fd) });
      fotos = await api('/api/admin/galeria');
      cerrar();
      toast('Foto actualizada.');
      pintarRejilla(cont);
    });
  }));
}
