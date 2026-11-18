import { api } from '/components/api.js';

const form  = document.getElementById('form-login');
const aviso = document.getElementById('login-aviso');
const boton = form.querySelector('[type=submit]');
const clave = document.getElementById('clave');
const ver   = document.getElementById('ver-clave');

const mostrarAviso = (texto, tipo = 'error') => {
  aviso.textContent = texto;
  aviso.dataset.tipo = tipo;
  aviso.hidden = false;
};

if (new URLSearchParams(location.search).has('expirada')) {
  mostrarAviso('Tu sesión expiró. Ingresa de nuevo.', 'info');
}

ver.addEventListener('click', () => {
  const visible = clave.type === 'text';
  clave.type = visible ? 'password' : 'text';
  ver.textContent = visible ? 'Ver' : 'Ocultar';
  ver.setAttribute('aria-pressed', String(!visible));
});

boton.disabled = false;
document.getElementById('usuario').focus();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  if (!datos.usuario.trim() || !datos.clave) return mostrarAviso('Escribe tu usuario y contraseña.');
  boton.disabled = true;
  boton.textContent = 'Verificando…';
  try {
    await api('/api/auth/login', { metodo: 'POST', datos });
    location.href = '/admin/';
  } catch (err) {
    mostrarAviso(err.message);
    clave.value = '';
    clave.focus();
    boton.disabled = false;
    boton.textContent = 'Ingresar al panel';
  }
});
