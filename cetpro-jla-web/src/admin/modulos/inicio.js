/** PÁGINA DE INICIO — textos del banner principal con vista previa en vivo. */
import { api } from '/components/api.js';
import { html, ico, campo, toast, activarFormulario, alEnviar, cabeceraTarjeta } from '/components/ui.js';

const CAMPOS = ['inicio_eyebrow', 'inicio_titulo', 'inicio_titulo_destacado', 'inicio_lead', 'inicio_boton'];

export async function render(cont) {
  const cfg = await api('/api/admin/configuracion');

  cont.innerHTML = String(html`
    <div class="rejilla-editor">
      <section class="tarjeta">
        ${cabeceraTarjeta({ titulo: 'Banner principal', subtitulo: 'Lo primero que ve un visitante al entrar a la web' })}
        <form id="form-inicio" class="formulario" novalidate>
          ${campo({ etiqueta: 'Etiqueta superior', nombre: 'inicio_eyebrow', valor: cfg.inicio_eyebrow, max: 80, ayuda: 'Texto pequeño sobre el título', ancho: 'completo' })}
          ${campo({ etiqueta: 'Título', nombre: 'inicio_titulo', valor: cfg.inicio_titulo, max: 80, requerido: true })}
          ${campo({ etiqueta: 'Parte destacada del título', nombre: 'inicio_titulo_destacado', valor: cfg.inicio_titulo_destacado, max: 80, ayuda: 'Se muestra en color, después del título' })}
          ${campo({ etiqueta: 'Texto de presentación', nombre: 'inicio_lead', tipo: 'textarea', valor: cfg.inicio_lead, max: 320, filas: 4, ancho: 'completo' })}
          ${campo({ etiqueta: 'Texto del botón', nombre: 'inicio_boton', valor: cfg.inicio_boton, max: 40, requerido: true, ayuda: 'Lleva a la sección de carreras', ancho: 'completo' })}
          <div class="formulario__acciones campo--completo">
            <a class="btn btn--sec" href="/#inicio" target="_blank" rel="noopener">${ico('externo', 16)} Ver en la web</a>
            <button type="submit" class="btn btn--pri">${ico('guardar', 18)} Guardar y publicar</button>
          </div>
        </form>
      </section>

      <section class="tarjeta vista-previa" aria-label="Vista previa">
        ${cabeceraTarjeta({ titulo: 'Vista previa', subtitulo: 'Así se verá en la portada' })}
        <div class="hero-previa">
          <span class="hero-previa__eyebrow" data-previa="inicio_eyebrow"></span>
          <p class="hero-previa__titulo"><span data-previa="inicio_titulo"></span> <mark data-previa="inicio_titulo_destacado"></mark></p>
          <p class="hero-previa__lead" data-previa="inicio_lead"></p>
          <span class="hero-previa__boton" data-previa="inicio_boton"></span>
        </div>
        <p class="texto-suave">La imagen del retablo y las cifras (carreras y ciclos) se calculan solas a partir de las especialidades publicadas.</p>
      </section>
    </div>`);

  const form = cont.querySelector('#form-inicio');
  activarFormulario(form);

  const actualizarPrevia = () => {
    CAMPOS.forEach(c => {
      cont.querySelector(`[data-previa="${c}"]`).textContent = form.elements[c].value;
    });
  };
  form.addEventListener('input', actualizarPrevia);
  actualizarPrevia();

  alEnviar(form, async (fd) => {
    await api('/api/admin/configuracion', { metodo: 'PUT', datos: Object.fromEntries(CAMPOS.map(c => [c, fd.get(c)])) });
    toast('Portada actualizada. Ya se ve en la web.');
  });
}
