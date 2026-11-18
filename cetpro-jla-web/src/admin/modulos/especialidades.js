/** ESPECIALIDADES — tabla con imagen, nombre, duración, estado y acciones (como en el diseño). */
import { api } from '/components/api.js';
import {
  html, crudo, ico, campo, campoEstado, campoImagen, abrirModal, confirmar, toast,
  activarFormulario, alEnviar, pildoraEstado, vacio, cabeceraTarjeta,
} from '/components/ui.js';

// Colores tomados del logo institucional (styles.css del sitio)
const COLORES = ['#0A6C9E', '#0A5F8C', '#B84E0C', '#9A6A00', '#1A7F26', '#C0262D', '#6B3FA0', '#0B2E4A'];

let lista = [];
const filtros = { texto: '', ciclo: '', estado: '' };

// Ciclos autorizados por la RD N.° 02617-2026-UGEL-HGA (database/oferta-rd-02617.js)
const NOMBRE_CICLO = { auxiliar: 'Ciclo Auxiliar Técnico', tecnico: 'Ciclo Técnico', basico: 'Ciclo Básico' };
const DURACION_SUGERIDA = {
  auxiliar: ['1 año · 2 módulos · 1024 horas', '1 Año'],
  tecnico:  ['2 años · 4 módulos · 2048 horas', '2 Años'],
  basico:   ['Módulos de 240 a 300 horas', 'Módulos'],
};

export async function render(cont, ctx) {
  lista = await api('/api/admin/especialidades');

  cont.innerHTML = String(html`
    <section class="tarjeta">
      ${cabeceraTarjeta({
        titulo: 'Especialidades',
        subtitulo: 'Administra los programas de formación',
        acciones: html`<button type="button" class="btn btn--pri" data-nueva>${ico('mas', 18)} Nueva especialidad</button>`,
      })}
      <div class="filtros">
        <label class="buscador">${ico('buscar', 18)}<span class="sr">Buscar</span>
          <input type="search" placeholder="Buscar especialidad…" data-filtro="texto" value="${filtros.texto}"></label>
        <select data-filtro="ciclo" aria-label="Filtrar por ciclo">
          <option value="">Todos los ciclos</option>
          <option value="auxiliar">Auxiliar Técnico (1 año)</option>
          <option value="tecnico">Técnico (2 años)</option>
          <option value="basico">Básico (módulos)</option>
        </select>
        <select data-filtro="estado" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
        </select>
      </div>
      <div id="tabla-especialidades"></div>
    </section>`);

  cont.querySelectorAll('[data-filtro]').forEach(el => {
    el.value = filtros[el.dataset.filtro];
    el.addEventListener('input', () => { filtros[el.dataset.filtro] = el.value; pintarTabla(cont); });
  });
  cont.querySelector('[data-nueva]').addEventListener('click', () => formulario(cont));
  pintarTabla(cont);

  if (ctx.accion === 'nueva') {
    history.replaceState(null, '', '#/especialidades');
    formulario(cont);
  }
}

function pintarTabla(cont) {
  const t = filtros.texto.toLowerCase();
  const visibles = lista.filter(e =>
    (!t || e.nombre.toLowerCase().includes(t)) &&
    (!filtros.ciclo || e.ciclo === filtros.ciclo) &&
    (!filtros.estado || e.estado === filtros.estado));

  const caja = cont.querySelector('#tabla-especialidades');
  if (!lista.length) {
    caja.innerHTML = String(vacio({ icono: 'birrete', titulo: 'Sin especialidades', texto: 'Crea la primera para mostrarla en la web.' }));
    return;
  }
  caja.innerHTML = String(html`
    <div class="tabla-envoltura">
    <table class="tabla">
      <thead><tr>
        <th scope="col">Imagen</th><th scope="col">Nombre</th><th scope="col">Duración</th>
        <th scope="col">Estado</th><th scope="col" class="tabla__acciones-th">Acciones</th>
      </tr></thead>
      <tbody>
        ${visibles.length ? visibles.map(e => html`
          <tr>
            <td data-titulo="Imagen">
              <span class="miniatura" style="--c:${e.color}">
                ${e.imagen ? html`<img src="${e.imagen}" alt="">` : e.icono_svg ? crudo(e.icono_svg) : ico('birrete', 22)}
              </span>
            </td>
            <td data-titulo="Nombre"><strong>${e.nombre}</strong><small class="tabla__sub">${NOMBRE_CICLO[e.ciclo] || 'Ciclo Auxiliar Técnico'}</small></td>
            <td data-titulo="Duración">${e.duracion.replace(/ de estudio$/i, '')}</td>
            <td data-titulo="Estado">${pildoraEstado(e.estado)}</td>
            <td class="tabla__acciones">
              <button type="button" class="btn-accion btn-accion--azul" data-editar="${e.id}" title="Editar" aria-label="Editar ${e.nombre}">${ico('lapiz', 17)}</button>
              <button type="button" class="btn-accion" data-visible="${e.id}"
                title="${e.estado === 'publicado' ? 'Ocultar de la web' : 'Publicar en la web'}"
                aria-label="${e.estado === 'publicado' ? 'Ocultar' : 'Publicar'} ${e.nombre}">${ico(e.estado === 'publicado' ? 'ojo' : 'ojoNo', 17)}</button>
              <button type="button" class="btn-accion btn-accion--rojo" data-borrar="${e.id}" title="Eliminar" aria-label="Eliminar ${e.nombre}">${ico('basura', 17)}</button>
            </td>
          </tr>`) : html`<tr><td colspan="5" class="tabla__vacia">Ninguna especialidad coincide con el filtro.</td></tr>`}
      </tbody>
    </table>
    </div>
    <p class="tabla__nota">${lista.filter(e => e.estado === 'publicado').length} de ${lista.length} visibles en la web · El orden de la tabla es el de la web.</p>`);

  caja.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () =>
    formulario(cont, lista.find(e => e.id === Number(b.dataset.editar)))));

  caja.querySelectorAll('[data-visible]').forEach(b => b.addEventListener('click', async () => {
    const e = lista.find(x => x.id === Number(b.dataset.visible));
    const estado = e.estado === 'publicado' ? 'borrador' : 'publicado';
    try {
      await api(`/api/admin/especialidades/${e.id}/estado`, { metodo: 'PATCH', datos: { estado } });
      e.estado = estado;
      toast(estado === 'publicado' ? `«${e.nombre}» ya se ve en la web.` : `«${e.nombre}» se ocultó de la web.`);
      pintarTabla(cont);
    } catch (err) { toast(err.message, 'error'); }
  }));

  caja.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', async () => {
    const e = lista.find(x => x.id === Number(b.dataset.borrar));
    const ok = await confirmar(`Se eliminará «${e.nombre}» de la web y del panel. Si solo quieres ocultarla, usa el ojo.`);
    if (!ok) return;
    try {
      await api(`/api/admin/especialidades/${e.id}`, { metodo: 'DELETE' });
      lista = lista.filter(x => x.id !== e.id);
      toast('Especialidad eliminada.');
      pintarTabla(cont);
    } catch (err) { toast(err.message, 'error'); }
  }));
}

function formulario(cont, e = null) {
  const nuevo = !e;
  e = e || { nombre: '', ciclo: 'auxiliar', duracion: '1 Año de estudio', duracion_corta: '1 Año', color: COLORES[0],
             descripcion_corta: '', descripcion: '', requisitos: [], turnos: ['Mañana (7:30 – 12:30)', 'Tarde (14:00 – 18:45)'],
             estado: 'publicado', orden: (lista.at(-1)?.orden || 0) + 1 };

  const { d, cerrar } = abrirModal({
    titulo: nuevo ? 'Nueva especialidad' : `Editar: ${e.nombre}`,
    ancho: 'lg',
    cuerpo: html`
      <form id="form-especialidad" class="formulario" novalidate>
        ${campo({ etiqueta: 'Nombre', nombre: 'nombre', valor: e.nombre, max: 80, requerido: true, ancho: 'completo' })}
        ${campo({ etiqueta: 'Ciclo', nombre: 'ciclo', tipo: 'select', valor: e.ciclo, opciones: [['auxiliar', 'Ciclo Auxiliar Técnico'], ['tecnico', 'Ciclo Técnico'], ['basico', 'Ciclo Básico']] })}
        ${campo({ etiqueta: 'Duración', nombre: 'duracion', valor: e.duracion, max: 40, requerido: true, ayuda: 'Ej.: 2 Años de estudio' })}
        ${campo({ etiqueta: 'Etiqueta corta', nombre: 'duracion_corta', valor: e.duracion_corta, max: 15, ayuda: 'Insignia de la tarjeta: «1 Año»' })}
        ${campo({ etiqueta: 'Orden en la web', nombre: 'orden', tipo: 'number', valor: e.orden, min: 0 })}
        <div class="campo campo--completo">
          <span class="campo__etiqueta" id="etq-color">Color de la tarjeta</span>
          <div class="colores" role="radiogroup" aria-labelledby="etq-color">
            ${COLORES.map(c => html`<label class="colores__opcion" style="--c:${c}">
              <input type="radio" name="color" value="${c}" ${c === e.color.toUpperCase() ? crudo('checked') : ''}><span class="sr">${c}</span></label>`)}
            <label class="colores__libre" title="Otro color"><input type="color" name="color_libre" value="${e.color}" aria-label="Otro color"></label>
          </div>
        </div>
        ${campo({ etiqueta: 'Descripción corta (tarjeta)', nombre: 'descripcion_corta', tipo: 'textarea', valor: e.descripcion_corta, max: 220, filas: 2, requerido: true, ancho: 'completo' })}
        ${campo({ etiqueta: 'Descripción completa («Ver detalles»)', nombre: 'descripcion', tipo: 'textarea', valor: e.descripcion, max: 1500, filas: 4, ancho: 'completo' })}
        ${campo({ etiqueta: 'Requisitos', nombre: 'requisitos', tipo: 'textarea', valor: e.requisitos.join('\n'), filas: 5, ayuda: 'Uno por línea' })}
        ${campo({ etiqueta: 'Turnos', nombre: 'turnos', tipo: 'textarea', valor: e.turnos.join('\n'), filas: 5, ayuda: 'Uno por línea' })}
        ${campoImagen({ actual: e.imagen, etiqueta: 'Foto del taller', ayuda: 'Aparece arriba de la tarjeta · JPG, PNG o WEBP · máx. 3 MB' })}
        ${campoEstado(e.estado)}
      </form>`,
    pie: html`
      <button type="button" class="btn btn--sec" data-cerrar>Cancelar</button>
      <button type="submit" form="form-especialidad" class="btn btn--pri">${ico('guardar', 18)} ${nuevo ? 'Crear y guardar' : 'Guardar cambios'}</button>`,
  });

  const form = d.querySelector('form');
  activarFormulario(form);

  // Al cambiar de ciclo se sugiere la duración
  form.elements.ciclo.addEventListener('change', () => {
    const [larga, corta] = DURACION_SUGERIDA[form.elements.ciclo.value] || DURACION_SUGERIDA.auxiliar;
    form.elements.duracion.value = larga;
    form.elements.duracion_corta.value = corta;
  });
  // El selector libre desmarca los colores predefinidos
  form.elements.color_libre.addEventListener('input', () => form.querySelectorAll('[name=color]').forEach(r => { r.checked = false; }));

  alEnviar(form, async (fd) => {
    if (!form.querySelector('[name=color]:checked')) fd.set('color', fd.get('color_libre'));
    fd.delete('color_libre');
    const guardada = await api(nuevo ? '/api/admin/especialidades' : `/api/admin/especialidades/${e.id}`,
      { metodo: nuevo ? 'POST' : 'PUT', formData: fd });
    lista = nuevo ? [...lista, guardada] : lista.map(x => (x.id === guardada.id ? guardada : x));
    lista.sort((a, b) => a.orden - b.orden || a.id - b.id);
    cerrar();
    toast(guardada.estado === 'publicado' ? `«${guardada.nombre}» guardada y publicada en la web.` : `«${guardada.nombre}» guardada como borrador.`);
    pintarTabla(cont);
  });
}
