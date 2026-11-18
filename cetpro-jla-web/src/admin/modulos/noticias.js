/** NOTICIAS — eventos, talleres y logros. La web muestra las 3 más recientes publicadas. */
import { api } from '/components/api.js';
import {
  html, ico, campo, campoEstado, campoImagen, abrirModal, confirmar, toast,
  activarFormulario, alEnviar, pildoraEstado, vacio, cabeceraTarjeta, fecha, hoy,
} from '/components/ui.js';

let lista = [];

export async function render(cont, ctx) {
  lista = await api('/api/admin/noticias');
  pintar(cont);
  if (ctx.accion === 'nueva') {
    history.replaceState(null, '', '#/noticias');
    formulario(cont);
  }
}

function pintar(cont) {
  const enPortada = lista.filter(n => n.estado === 'publicado').slice(0, 3).map(n => n.id);
  cont.innerHTML = String(html`
    <section class="tarjeta">
      ${cabeceraTarjeta({
        titulo: 'Noticias y actividades',
        subtitulo: 'Las 3 publicadas más recientes salen en la portada',
        acciones: html`<button type="button" class="btn btn--pri" data-nueva>${ico('mas', 18)} Publicar noticia</button>`,
      })}
      ${lista.length ? html`
        <div class="noticias-admin">
          ${lista.map(n => html`
            <article class="noticia-admin">
              <div class="noticia-admin__foto">${n.imagen ? html`<img src="${n.imagen}" alt="">` : ico('noticia', 30)}</div>
              <div class="noticia-admin__cuerpo">
                <div class="noticia-admin__meta">
                  <time datetime="${n.fecha}">${fecha(n.fecha)}</time>
                  ${pildoraEstado(n.estado)}
                  ${enPortada.includes(n.id) ? html`<span class="pildora pildora--azul">En portada</span>` : ''}
                </div>
                <h3>${n.titulo}</h3>
                <p>${n.resumen}</p>
              </div>
              <div class="noticia-admin__acciones">
                ${n.estado === 'publicado' ? html`<a class="btn-accion" href="/noticias/${n.id}" target="_blank" rel="noopener" title="Ver en la web" aria-label="Ver ${n.titulo} en la web">${ico('externo', 17)}</a>` : ''}
                <button type="button" class="btn-accion btn-accion--azul" data-editar="${n.id}" title="Editar" aria-label="Editar ${n.titulo}">${ico('lapiz', 17)}</button>
                <button type="button" class="btn-accion btn-accion--rojo" data-borrar="${n.id}" title="Eliminar" aria-label="Eliminar ${n.titulo}">${ico('basura', 17)}</button>
              </div>
            </article>`)}
        </div>` : vacio({
          icono: 'noticia', titulo: 'Aún no hay noticias',
          texto: 'Publica inscripciones, talleres demostrativos, ferias o logros. La sección aparece en la web con la primera noticia publicada.',
        })}
    </section>`);

  cont.querySelector('[data-nueva]').addEventListener('click', () => formulario(cont));
  cont.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () =>
    formulario(cont, lista.find(n => n.id === Number(b.dataset.editar)))));
  cont.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', async () => {
    const n = lista.find(x => x.id === Number(b.dataset.borrar));
    if (!await confirmar(`Se eliminará la noticia «${n.titulo}» y su imagen.`)) return;
    try {
      await api(`/api/admin/noticias/${n.id}`, { metodo: 'DELETE' });
      lista = lista.filter(x => x.id !== n.id);
      toast('Noticia eliminada.');
      pintar(cont);
    } catch (err) { toast(err.message, 'error'); }
  }));
}

function formulario(cont, n = null) {
  const nueva = !n;
  n = n || { titulo: '', fecha: hoy(), resumen: '', contenido: '', estado: 'publicado' };

  const { d, cerrar } = abrirModal({
    titulo: nueva ? 'Publicar noticia' : 'Editar noticia',
    ancho: 'lg',
    cuerpo: html`
      <form id="form-noticia" class="formulario" novalidate>
        ${campo({ etiqueta: 'Título', nombre: 'titulo', valor: n.titulo, max: 140, requerido: true, ancho: 'completo' })}
        ${campo({ etiqueta: 'Fecha', nombre: 'fecha', tipo: 'date', valor: n.fecha, requerido: true })}
        <div></div>
        ${campo({ etiqueta: 'Resumen', nombre: 'resumen', tipo: 'textarea', valor: n.resumen, max: 300, filas: 2, ancho: 'completo', ayuda: 'Se ve en la tarjeta de la portada' })}
        ${campo({ etiqueta: 'Contenido completo', nombre: 'contenido', tipo: 'textarea', valor: n.contenido, max: 8000, filas: 8, ancho: 'completo', ayuda: 'Deja una línea en blanco entre párrafos' })}
        ${campoImagen({ actual: n.imagen })}
        ${campoEstado(n.estado)}
      </form>`,
    pie: html`
      <button type="button" class="btn btn--sec" data-cerrar>Cancelar</button>
      <button type="submit" form="form-noticia" class="btn btn--pri">${ico('guardar', 18)} Guardar</button>`,
  });

  const form = d.querySelector('form');
  activarFormulario(form);
  alEnviar(form, async (fd) => {
    const g = await api(nueva ? '/api/admin/noticias' : `/api/admin/noticias/${n.id}`,
      { metodo: nueva ? 'POST' : 'PUT', formData: fd });
    lista = nueva ? [g, ...lista] : lista.map(x => (x.id === g.id ? g : x));
    lista.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
    cerrar();
    toast(g.estado === 'publicado' ? 'Noticia publicada en la web.' : 'Noticia guardada como borrador.');
    pintar(cont);
  });
}
