# CETPRO Joaquín López Antay — Web + Panel del administrador

Sitio web institucional del CETPRO JLA (Ayacucho) con un **panel de administrador**
para gestionar su contenido sin tocar código: lo que se guarda en el panel aparece
al instante en la web pública.

---

## 1. Estructura

```
cetpro-jla-web/
├── public/                 # Imágenes, logo, banners
│   ├── img/                #   logo.jpg, retablo-carreras.(jpg|webp)
│   └── uploads/            #   fotos que se suben desde el panel
├── src/
│   ├── pages/              # Vistas del sitio (index, matrícula, noticia)
│   ├── admin/              # Panel del administrador
│   │   ├── login.html · index.html · admin.js · login.js
│   │   └── modulos/        #   un archivo por opción del menú lateral
│   ├── components/         # Componentes reutilizables del navegador
│   │   ├── main.js         #   interacción de la web (menú, modal, filtros…)
│   │   ├── consulta.js     #   formulario «Déjanos tu consulta»
│   │   └── ui.js · api.js · iconos.js   (piezas del panel)
│   ├── styles/             # CSS: styles.css (web), sitio-dinamico.css, admin.css
│   ├── utils/              # Funciones y configuraciones del servidor
│   │   ├── config.js · auth.js · validar.js · subidas.js · render.js
│   │   └── verificar-estructura.js
│   ├── api/                # Rutas de la API (auth, admin, público)
│   └── server.js           # Servidor Express
├── database/               # Conexión y scripts de BD
│   ├── db.js               #   conexión (SQLite con sql.js)
│   ├── schema.sql          #   tablas
│   ├── seed.sql            #   especialidades iniciales y datos de contacto reales
│   ├── oferta-rd-02617.js  #   oferta oficial (RD N.° 02617-2026-UGEL-HGA)
│   └── crear-admin.js      #   crear usuario / cambiar contraseña
├── package.json
└── README.md
```

Comprueba la estructura cuando quieras con `npm run verificar`.

> `src/api/` es la única carpeta que no está en el diagrama original: el diagrama
> no indica dónde va el servidor, y separar las rutas evita mezclarlas con `utils/`.

---

## 2. Cómo ejecutarlo (Windows)

1. Instala **Node.js LTS** (versión 18 o superior) desde <https://nodejs.org>.
2. Abre la carpeta `cetpro-jla-web` en VS Code y, en la terminal:

   ```bash
   npm install
   npm start
   ```

3. La primera vez la consola muestra el usuario y una **contraseña generada**:

   ```
   ┌─ Usuario del panel creado
   │  Usuario:    admin
   │  Contraseña: xxxxxxxxxxxx
   ```

   Anótala. Para elegirla tú, crea un archivo `.env` (copia de `.env.example`) con
   `ADMIN_CLAVE=TuClaveSegura2026` **antes** del primer `npm start`.

4. Abre:
   - Web pública → <http://localhost:3000>
   - Panel → <http://localhost:3000/admin>

¿Olvidaste la contraseña?

```bash
npm run crear-admin -- admin NuevaClaveSegura2026 "Nombre Apellido"
```

Para desarrollo con recarga automática: `npm run dev`.

---

## 3. Módulos del panel

| Módulo | Qué hace | Dónde se ve en la web |
|---|---|---|
| **Dashboard** | Indicadores, accesos rápidos, últimas consultas, estado de la web | — |
| **Página de inicio** | Título, texto y botón del banner, con vista previa | Portada |
| **Especialidades** | Crear, editar, ocultar (👁) o eliminar programas; foto, color, requisitos, turnos | Tarjetas, «Ver detalles», select de matrícula, sección «Programas autorizados» |
| **Admisión / Convocatorias** | Fechas, vacantes y requisitos; se oculta sola al pasar la fecha de cierre | Banner debajo de las carreras |
| **Noticias** | Publicar con imagen; la portada muestra las 3 más recientes | Sección «Noticias y actividades» + página `/noticias/:id` |
| **Galería** | Subir hasta 10 fotos a la vez y asociarlas a una carrera | Mural «Así se vive en nuestros talleres» y galería del modal |
| **Contactos** | Consultas del formulario de la web; marcar atendida o eliminar | Formulario en la sección Contacto |
| **Configuración** | Dirección, teléfonos, horario, WhatsApp, redes; cambio de contraseña | Contacto, pie de página, botón de WhatsApp |

Las secciones vacías (noticias, convocatoria, mural) **no aparecen** en la web
hasta que publiques el primer elemento: nunca se ven huecos ni textos de ejemplo.

---

## 4. Seguridad (aplica `AUDITORIA_SEGURIDAD.md`)

- Contraseñas con **scrypt + sal**; nunca se guardan en texto plano.
- Sesión con cookie **HttpOnly + SameSite=Strict**; expira a las 8 h.
- **5 intentos** de inicio de sesión por IP cada 15 minutos.
- Cabecera anti-CSRF obligatoria en toda petición que modifica datos.
- **Content-Security-Policy**, `nosniff`, `frame-ancestors 'none'`, `Referrer-Policy`.
- Todo texto del panel se **escapa** antes de llegar al HTML (probado con `<script>`).
- Las imágenes se validan por su **contenido real** (JPG/PNG/WEBP); SVG no se acepta.
- El formulario de consultas usa **POST** al propio servidor, no pide DNI y
  tiene casilla de consentimiento y campo trampa contra robots.
- Pendiente de la auditoría: **verificar el WhatsApp institucional** (el panel
  avisa mientras siga el número de ejemplo `51900000000`).

---

## 5. Publicarlo en internet

GitHub Pages **no** sirve para esta versión (solo aloja archivos estáticos y aquí
hay servidor y base de datos). Opciones con Node.js:

- **Render** o **Railway**: conectar el repositorio, comando `npm start`,
  y agregar un **disco persistente** montado en `database/` y `public/uploads/`
  (si no, se pierden los datos en cada despliegue).
- Variables de entorno en el hosting: `COOKIE_SEGURA=true`, `DETRAS_DE_PROXY=true`.

La base (`database/cetpro.sqlite`) y las fotos subidas **no se suben a GitHub**
(están en `.gitignore`). Haz copia de esos dos lugares para respaldar el contenido.

---

## 6. Relación con la versión estática

La versión estática anterior está en la raíz de este repositorio y se conserva
sin cambios como respaldo (y como sitio de GitHub Pages). Esta carpeta parte de ella: mismo diseño, mismo `styles.css` y mismo
`main.js`, con estos cambios:

- Las 9 carreras, la portada y los datos de contacto ahora salen de la BD.
- `main.js` lee los datos que inserta el servidor y ya no usa `innerHTML`
  con textos editables.
- Nuevas secciones: convocatoria, noticias y formulario de consultas.

---

## 7. Oferta autorizada — RD N.° 02617-2026-UGEL-HGA

La UGEL Huamanga aprobó la oferta del CETPRO el 28 de mayo de 2026. La web la
refleja tal cual, con `database/oferta-rd-02617.js` como única fuente oficial:

| Ciclo | Programas | Módulos | Vigencia |
|---|---|---|---|
| **Técnico** (Art. 1.°) | Estilismo · Fabricación de Prendas de Vestir · Mantenimiento de Sistemas Electrónicos | 4 × 512 h = 2048 h, 80 créditos | 02/03/2026 – 31/12/2027 |
| **Auxiliar Técnico** (Art. 2.°) | Apoyo Administrativo · Servicios Básicos Gastronómicos · Soporte Técnico y Operaciones de Centros de Cómputo · Panadería y Pastelería · Cuidado del Niño(a) y Adulto Mayor | 2 × 512 h = 1024 h, 40 créditos | 02/03/2026 – 31/12/2026 |
| **Básico** (Art. 3.°) | Mecánica y Metales · Mantenimiento Básico de Casas y Edificios | 4 módulos de 240–300 h cada uno | 02/03/2026 – 31/12/2026 |

**Al actualizar desde una versión anterior** basta con `npm start`: `db.js`
agrega las columnas `familia` y `modulos`, habilita el ciclo `basico`
(reconstruye la tabla sin perder ids ni fotos de la galería) y aplica la RD
**una sola vez**. Las descripciones que ya se editaron en el panel se respetan.

En la web: pestaña «Ciclo Básico», módulos con horas y créditos en «Ver detalles»
y la sección «Programas autorizados» con la resolución y las vigencias.
