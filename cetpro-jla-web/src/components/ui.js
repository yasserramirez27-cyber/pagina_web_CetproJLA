/**
 * ================================================================
 * COMPONENTES REUTILIZABLES DEL PANEL
 * html``, avisos (toast), ventanas modales (<dialog>), confirmación,
 * campos de formulario, selector de imagen, estado vacío.
 * ================================================================
 */
import { icono } from './iconos.js';

/* ── HTML seguro ─────────────────────────────────────────────── */
// Todo lo que se interpola en html`` se escapa, salvo lo marcado con crudo()
class Crudo { constructor(v) { this.v = String(v); } toString() { return this.v; } }
export const crudo = (v) => new Crudo(v);

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const valor = (v) => {
  if (v instanceof Crudo) return v.v;
  if (Array.isArray(v)) return v.map(valor).join('');
  if (v === false || v === null || v === undefined) return '';
  return esc(v);
};

export function html(partes, ...vals) {
  return crudo(partes.reduce((acc, p, i) => acc + p + (i < vals.length ? valor(vals[i]) : ''), ''));
}

export const ico = (nombre, tam) => crudo(icono(nombre, tam));

/* ── Fechas ──────────────────────────────────────────────────── */
const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'];
export function fecha(iso, conHora = false) {
  if (!iso) return '—';
  const [f, h = ''] = iso.split(/[ T]/);
  const [a, m, d] = f.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}${conHora && h ? ' · ' + h.slice(0, 5) : ''}`;
}
export const hoy = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/* ── Avisos ──────────────────────────────────────────────────── */
export function toast(mensaje, tipo = 'ok') {
  let zona = document.getElementById('toasts');
  if (!zona) {
    zona = document.createElement('div');
    zona.id = 'toasts';
    zona.className = 'toasts';
    zona.setAttribute('role', 'status');
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }
  const t = document.createElement('div');
  t.className = `toast toast--${tipo}`;
  t.innerHTML = String(html`${ico(tipo === 'error' ? 'alerta' : 'check', 18)}<span>${mensaje}</span>`);
  zona.append(t);
  setTimeout(() => { t.classList.add('toast--saliendo'); setTimeout(() => t.remove(), 300); }, tipo === 'error' ? 6000 : 3200);
}

/* ── Modal con <dialog> (foco, ESC y accesibilidad nativos) ──── */
export function abrirModal({ titulo, cuerpo, pie = '', ancho = 'md', alCerrar } = {}) {
  const d = document.createElement('dialog');
  d.className = `modal modal--${ancho}`;
  d.setAttribute('aria-labelledby', 'modal-titulo');
  d.innerHTML = String(html`
    <div class="modal__cabecera">
      <h2 id="modal-titulo">${titulo}</h2>
      <button type="button" class="btn-icono" data-cerrar aria-label="Cerrar">${ico('x')}</button>
    </div>
    <div class="modal__cuerpo">${cuerpo}</div>
    ${pie ? html`<div class="modal__pie">${pie}</div>` : ''}`);
  document.body.append(d);
  const cerrar = () => d.close();
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-cerrar]')) cerrar();
  });
  d.addEventListener('close', () => { d.remove(); alCerrar?.(); });
  d.showModal();
  return { d, cerrar };
}

export function confirmar(mensaje, { titulo = '¿Estás seguro?', boton = 'Eliminar', peligro = true } = {}) {
  return new Promise((resolver) => {
    let respuesta = false;
    const { d } = abrirModal({
      titulo, ancho: 'sm',
      cuerpo: html`<p class="confirmar__texto">${mensaje}</p>`,
      pie: html`<button type="button" class="btn btn--sec" data-cerrar>Cancelar</button>
                <button type="button" class="btn ${peligro ? 'btn--peligro' : 'btn--pri'}" data-ok>${boton}</button>`,
      alCerrar: () => resolver(respuesta),
    });
    d.querySelector('[data-ok]').addEventListener('click', () => { respuesta = true; d.close(); });
  });
}

/* ── Campos de formulario ────────────────────────────────────── */
let contadorCampos = 0;
/**
 * campo({ etiqueta, nombre, tipo, valor, requerido, max, ayuda, opciones, filas, ancho })
 * tipo: text | textarea | select | date | number | color | email | url | password
 */
export function campo(o) {
  const id = `c-${o.nombre}-${++contadorCampos}`;
  const comunes = html`id="${id}" name="${o.nombre}" ${o.requerido ? crudo('required') : ''}
    ${o.max ? html`maxlength="${o.max}"` : ''} ${o.placeholder ? html`placeholder="${o.placeholder}"` : ''}
    ${o.ayuda ? html`aria-describedby="${id}-ayuda"` : ''} ${o.extra ? crudo(o.extra) : ''}`;
  let control;
  if (o.tipo === 'textarea') {
    control = html`<textarea ${comunes} rows="${o.filas || 4}">${o.valor ?? ''}</textarea>`;
  } else if (o.tipo === 'select') {
    control = html`<select ${comunes}>${o.opciones.map(([v, t]) =>
      html`<option value="${v}" ${String(v) === String(o.valor ?? '') ? crudo('selected') : ''}>${t}</option>`)}</select>`;
  } else {
    control = html`<input type="${o.tipo || 'text'}" ${comunes} value="${o.valor ?? ''}"
      ${o.min !== undefined ? html`min="${o.min}"` : ''}>`;
  }
  const contador = o.max && (o.tipo === 'textarea' || o.contador)
    ? html`<span class="campo__contador" data-contador-de="${id}">${String(o.valor ?? '').length}/${o.max}</span>` : '';
  return html`
    <div class="campo ${o.ancho === 'completo' ? 'campo--completo' : ''}">
      <label for="${id}">${o.etiqueta}${o.requerido ? html` <span class="campo__req" aria-hidden="true">*</span>` : ''}</label>
      ${control}
      ${o.ayuda || contador ? html`<div class="campo__pie">
        ${o.ayuda ? html`<span class="campo__ayuda" id="${id}-ayuda">${o.ayuda}</span>` : html`<span></span>`}${contador}</div>` : ''}
    </div>`;
}

/** Interruptor Publicado / Borrador. */
export function campoEstado(valor = 'publicado') {
  return html`
    <fieldset class="campo campo--completo estado-switch">
      <legend>Visibilidad en la web</legend>
      <label><input type="radio" name="estado" value="publicado" ${valor === 'publicado' ? crudo('checked') : ''}>
        <span>${ico('ojo', 16)} Publicado</span></label>
      <label><input type="radio" name="estado" value="borrador" ${valor === 'borrador' ? crudo('checked') : ''}>
        <span>${ico('ojoNo', 16)} Borrador</span></label>
    </fieldset>`;
}

/** Selector de imagen con vista previa. */
export function campoImagen({ nombre = 'imagen', actual = '', etiqueta = 'Imagen', ayuda = 'JPG, PNG o WEBP · máx. 3 MB · horizontal' } = {}) {
  return html`
    <div class="campo campo--completo campo-imagen" data-campo-imagen>
      <span class="campo__etiqueta">${etiqueta}</span>
      <div class="campo-imagen__caja">
        <div class="campo-imagen__vista ${actual ? '' : 'campo-imagen__vista--vacia'}">
          ${actual ? html`<img src="${actual}" alt="Vista previa">` : ico('imagen', 32)}
        </div>
        <div class="campo-imagen__acciones">
          <label class="btn btn--sec btn--sm">
            ${ico('subir', 16)} ${actual ? 'Cambiar imagen' : 'Elegir imagen'}
            <input type="file" name="${nombre}" accept="image/jpeg,image/png,image/webp" hidden>
          </label>
          ${actual ? html`<label class="campo-imagen__quitar"><input type="checkbox" name="quitar_imagen" value="1"> Quitar la imagen actual</label>` : ''}
          <span class="campo__ayuda">${ayuda}</span>
        </div>
      </div>
    </div>`;
}

/** Activa contadores de caracteres y vistas previas de imagen dentro de un formulario. */
export function activarFormulario(form) {
  form.querySelectorAll('[data-contador-de]').forEach(c => {
    const input = form.querySelector('#' + CSS.escape(c.dataset.contadorDe));
    const max = input.maxLength;
    input.addEventListener('input', () => {
      c.textContent = `${input.value.length}/${max}`;
      c.classList.toggle('campo__contador--lleno', input.value.length >= max);
    });
  });
  form.querySelectorAll('[data-campo-imagen]').forEach(caja => {
    const input = caja.querySelector('input[type=file]');
    const vista = caja.querySelector('.campo-imagen__vista');
    input.addEventListener('change', () => {
      const f = input.files[0];
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) { toast('La imagen pesa más de 3 MB. Comprímela en squoosh.app', 'error'); input.value = ''; return; }
      const img = document.createElement('img');
      img.alt = 'Vista previa';
      img.src = URL.createObjectURL(f);
      vista.replaceChildren(img);
      vista.classList.remove('campo-imagen__vista--vacia');
      const quitar = caja.querySelector('[name=quitar_imagen]');
      if (quitar) quitar.checked = false;
    });
  });
}

/** Envuelve el envío de un formulario: deshabilita el botón y muestra errores. */
export function alEnviar(form, accion) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const boton = form.querySelector('[type=submit]') || document.querySelector(`[form="${form.id}"][type=submit]`);
    const texto = boton?.innerHTML;
    if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }
    try {
      const fd = new FormData(form);
      // Un selector de archivo sin elegir envía un archivo vacío: se descarta
      for (const [k, v] of [...fd.entries()]) if (v instanceof File && !v.size) fd.delete(k);
      await accion(fd);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (boton && boton.isConnected) { boton.disabled = false; boton.innerHTML = texto; }
    }
  });
}

/* ── Piezas visuales ─────────────────────────────────────────── */
export const pildoraEstado = (estado) => estado === 'publicado'
  ? html`<span class="pildora pildora--ok">Publicado</span>`
  : html`<span class="pildora pildora--gris">Borrador</span>`;

export function vacio({ icono: nombreIco, titulo, texto, accion = '' }) {
  return html`
    <div class="vacio">
      <div class="vacio__icono">${ico(nombreIco, 34)}</div>
      <h3>${titulo}</h3>
      <p>${texto}</p>
      ${accion}
    </div>`;
}

export function cabeceraTarjeta({ titulo, subtitulo, acciones = '' }) {
  return html`
    <div class="tarjeta__cabecera">
      <div><h2>${titulo}</h2>${subtitulo ? html`<p>${subtitulo}</p>` : ''}</div>
      <div class="tarjeta__acciones">${acciones}</div>
    </div>`;
}
