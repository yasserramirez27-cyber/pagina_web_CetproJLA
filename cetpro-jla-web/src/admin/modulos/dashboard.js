/** DASHBOARD — indicadores, accesos rápidos, últimas consultas y estado de la web. */
import { api } from '/components/api.js';
import { html, ico, fecha, cabeceraTarjeta } from '/components/ui.js';

export async function render(cont, ctx) {
  const r = await ctx.refrescarAvisos() || await api('/api/admin/resumen');

  const kpis = [
    { ruta: 'especialidades', icono: 'birrete', n: r.especialidades.total, texto: 'Especialidades', det: `${r.especialidades.publicadas} publicadas`, color: 'azul' },
    { ruta: 'noticias',       icono: 'noticia', n: r.noticias.total,       texto: 'Noticias',       det: `${r.noticias.publicadas} publicadas`,       color: 'verde' },
    { ruta: 'galeria',        icono: 'imagen',  n: r.imagenes.total,       texto: 'Imágenes',       det: 'en la galería',                             color: 'morado' },
    { ruta: 'contactos',      icono: 'usuarios',n: r.consultas.total,      texto: 'Consultas',      det: r.consultas.sinLeer ? `${r.consultas.sinLeer} sin leer` : 'todas leídas', color: 'naranja' },
  ];

  const accesos = [
    { ruta: 'especialidades/nueva', icono: 'birrete',    texto: 'Nueva especialidad' },
    { ruta: 'noticias/nueva',       icono: 'noticia',    texto: 'Publicar noticia' },
    { ruta: 'galeria/subir',        icono: 'imagen',     texto: 'Subir imágenes' },
    { ruta: 'convocatorias/nueva',  icono: 'calendario', texto: 'Nueva convocatoria' },
  ];

  const pasos = [
    { icono: 'usuario', titulo: 'Iniciar sesión', texto: 'Usuario y contraseña', color: 'morado' },
    { icono: 'cursor',  titulo: 'Seleccionar módulo', texto: 'Especialidades, Noticias, etc.', color: 'azul' },
    { icono: 'lapiz',   titulo: 'Crear o editar', texto: 'Textos, imágenes, fechas', color: 'verde' },
    { icono: 'guardar', titulo: 'Guardar y publicar', texto: 'Los cambios se ven al instante en la web', color: 'naranja' },
  ];

  const c = r.convocatoria;
  const ultimoAcceso = ctx.usuario?.acceso_anterior;

  cont.innerHTML = String(html`
    <section class="saludo">
      <div>
        <p class="saludo__eyebrow">Hola, ${ctx.usuario?.nombre || 'Administrador'}</p>
        <h2>¿Qué vamos a publicar hoy?</h2>
        ${ultimoAcceso ? html`<p class="saludo__nota">Tu acceso anterior: ${fecha(ultimoAcceso, true)}</p>` : ''}
      </div>
      <a class="btn btn--claro" href="/" target="_blank" rel="noopener">${ico('mundo', 18)} Ver la web pública</a>
    </section>

    ${r.whatsappDeEjemplo ? html`
      <div class="alerta alerta--aviso">
        ${ico('alerta', 20)}
        <p><strong>El WhatsApp de la web es de ejemplo (51900000000).</strong> Los botones de WhatsApp no llegan a la institución.
          <a href="#/configuracion">Cámbialo en Configuración →</a></p>
      </div>` : ''}

    <div class="kpis">
      ${kpis.map(k => html`
        <a class="kpi kpi--${k.color}" href="#/${k.ruta}">
          <span class="kpi__icono">${ico(k.icono, 26)}</span>
          <span class="kpi__numero">${k.n}</span>
          <span class="kpi__texto">${k.texto}</span>
          <span class="kpi__detalle">${k.det}</span>
        </a>`)}
    </div>

    <section class="tarjeta">
      ${cabeceraTarjeta({ titulo: 'Accesos rápidos' })}
      <div class="accesos">
        ${accesos.map(a => html`
          <a class="acceso" href="#/${a.ruta}">
            <span class="acceso__icono">${ico(a.icono, 26)}</span>
            <span>+ ${a.texto}</span>
          </a>`)}
      </div>
    </section>

    <div class="rejilla-2">
      <section class="tarjeta">
        ${cabeceraTarjeta({ titulo: 'Últimas consultas', subtitulo: 'Enviadas desde el formulario de la web',
          acciones: html`<a class="enlace" href="#/contactos">Ver todas ${ico('flecha', 16)}</a>` })}
        ${r.ultimasConsultas.length ? html`
          <ul class="lista-consultas">
            ${r.ultimasConsultas.map(q => html`
              <li class="${q.leido ? '' : 'sin-leer'}">
                <span class="avatar avatar--sm" aria-hidden="true">${q.nombre.trim()[0]?.toUpperCase()}</span>
                <div>
                  <strong>${q.nombre}</strong>${q.leido ? '' : html` <span class="pildora pildora--naranja">Nueva</span>`}
                  <p>${q.especialidad ? html`<em>${q.especialidad}</em> · ` : ''}${q.mensaje.slice(0, 90)}${q.mensaje.length > 90 ? '…' : ''}</p>
                </div>
                <time>${fecha(q.creado)}</time>
              </li>`)}
          </ul>` : html`<p class="texto-suave">Aún no llegan consultas. Aparecerán aquí cuando alguien use el formulario de Contacto de la web.</p>`}
      </section>

      <section class="tarjeta">
        ${cabeceraTarjeta({ titulo: 'Estado de la web' })}
        <ul class="estado-web">
          <li>
            <span class="estado-web__icono ${c ? 'ok' : 'gris'}">${ico('megafono', 18)}</span>
            <div><strong>Convocatoria</strong>
              <p>${c ? html`«${c.titulo}» visible${c.fecha_fin ? ` hasta el ${fecha(c.fecha_fin)}` : ''}` : 'Ninguna publicada: el banner de admisión está oculto.'}</p></div>
            <a class="enlace" href="#/convocatorias">${c ? 'Editar' : 'Crear'}</a>
          </li>
          <li>
            <span class="estado-web__icono ${r.especialidades.publicadas ? 'ok' : 'gris'}">${ico('birrete', 18)}</span>
            <div><strong>Especialidades</strong><p>${r.especialidades.publicadas} de ${r.especialidades.total} visibles en la web</p></div>
            <a class="enlace" href="#/especialidades">Revisar</a>
          </li>
          <li>
            <span class="estado-web__icono ${r.noticias.publicadas ? 'ok' : 'gris'}">${ico('noticia', 18)}</span>
            <div><strong>Noticias</strong><p>${r.noticias.publicadas ? `${r.noticias.publicadas} publicadas (la web muestra las 3 más recientes)` : 'La sección de noticias está oculta hasta publicar la primera.'}</p></div>
            <a class="enlace" href="#/noticias">${r.noticias.publicadas ? 'Revisar' : 'Publicar'}</a>
          </li>
          <li>
            <span class="estado-web__icono ${r.imagenes.total ? 'ok' : 'gris'}">${ico('imagen', 18)}</span>
            <div><strong>Mural de talleres</strong><p>${r.imagenes.total ? `${r.imagenes.total} fotos en la galería` : 'Oculto hasta subir fotos a la Galería.'}</p></div>
            <a class="enlace" href="#/galeria">Galería</a>
          </li>
        </ul>
      </section>
    </div>

    <section class="tarjeta flujo">
      ${cabeceraTarjeta({ titulo: 'Flujo de uso del administrador' })}
      <ol class="flujo__pasos">
        ${pasos.map((p, i) => html`
          <li>
            <span class="flujo__icono flujo__icono--${p.color}">${ico(p.icono, 26)}</span>
            <strong>${i + 1}. ${p.titulo}</strong>
            <small>${p.texto}</small>
          </li>`)}
      </ol>
    </section>`);
}
