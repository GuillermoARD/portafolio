# Portafolio · Guillermo Doñe (CyberKnight)

Portafolio personal con **React + TypeScript + Vite** en el frontend y **Node.js + TypeScript + Express + Sequelize** en el backend. Incluye un **panel `/admin`** para que tú mismo subas y edites tus proyectos y habilidades sin tocar código.

```
portafolio/
├── client/                    # React + Vite
│   ├── src/data/profile.ts    # ← textos fijos: nombre, "sobre mí", redes
│   ├── src/admin/             # panel /admin (login + CRUD)
│   └── vercel.json            # rewrite de /admin si despliegas el front en Vercel
├── server/                    # Express + Sequelize
│   ├── src/db.ts              # modelos Project y SkillGroup
│   ├── src/seed.ts            # datos iniciales (solo la primera vez)
│   ├── src/routes/            # API pública y API del panel
│   ├── .env.example           # ← configuración (admin, BD, correo)
│   ├── data/                  # SQLite local (se crea solo, no se sube a git)
│   └── uploads/               # imágenes subidas desde el panel
└── scripts/dev.mjs            # levanta front y back a la vez
```

## Puesta en marcha

Requisitos: Node 22.12 o superior.

```bash
npm install
cp server/.env.example server/.env   # en Windows: copy server\.env.example server\.env
```

Edita `server/.env` y como mínimo pon una contraseña en `ADMIN_PASSWORD`. Después:

```bash
npm run dev
```

- Web: http://localhost:5173
- Panel: http://localhost:5173/admin (usuario `ADMIN_USER`, contraseña `ADMIN_PASSWORD`)
- API: http://localhost:3001

La primera vez que arranca, el servidor crea la base de datos SQLite en `server/data/portafolio.sqlite` y la llena con tus habilidades y **3 proyectos de ejemplo**. Bórralos o edítalos desde el panel.

## Qué se edita y dónde

| Contenido | Dónde |
|---|---|
| Proyectos: título, descripción, tecnologías, imagen, repo, demo, orden | Panel `/admin` → Proyectos |
| Habilidades por categoría, con icono de categoría y logo por tecnología | Panel `/admin` → Habilidades |
| Nombre, rol, "sobre mí", redes, correo visible | `client/src/data/profile.ts` |

## Panel de administración

- **Login:** usuario y contraseña definidos en `ADMIN_USER` y `ADMIN_PASSWORD`, en `server/.env`. No hay credenciales escritas en el código. Si `ADMIN_PASSWORD` está vacío, el panel queda desactivado.
- **Sesión:** un token firmado con HMAC (`SESSION_SECRET`) que caduca a las `SESSION_HOURS` horas y se guarda en `sessionStorage`, así que se borra al cerrar la pestaña.
- **Protección del login:** como mucho 10 intentos cada 15 minutos por IP.
- **Validación:** todo lo que se guarda pasa por Zod en el servidor (`server/src/schema.ts`). Los errores se muestran debajo de cada campo.
- **Imágenes:** puedes subir un archivo (JPG, PNG, WebP o GIF, hasta 3 MB) o pegar un enlace externo. Si borras o cambias una imagen subida, el archivo se elimina del disco.

### Logos de las habilidades

Al añadir una habilidad, por ejemplo "Node.js", el servidor busca su logo oficial en [Simple Icons](https://simpleicons.org) (licencia CC0, más de 3000 marcas) y lo guarda con su color original. La web pública no carga la librería: solo dibuja el logo que ya está guardado.

- Si la herramienta no está en Simple Icons (como TablePlus), puedes subir su logo desde el panel.
- Si no hay logo, se muestra la inicial.
- Los logos casi negros, como Express, se aclaran solos en el modo oscuro para que se vean.
- Para nombres que no coinciden con el oficial, añade un alias en `server/src/brandIcons.ts`.

## Base de datos

Se usa Sequelize, configurado en `server/.env`:

- **Desarrollo:** deja `DATABASE_URL` vacío y se usa SQLite (`server/data/portafolio.sqlite`). Puedes abrir ese archivo con TablePlus.
- **Producción con Postgres:** `DATABASE_URL=postgres://usuario:clave@host:5432/bd`. Pon también `DB_SSL=true` si tu proveedor lo pide (Render, Neon, Supabase…).
- **Producción con MySQL:** instala el driver con `npm install mysql2 -w server` y usa `DATABASE_URL=mysql://usuario:clave@host:3306/bd`.

Las tablas se crean solas al arrancar (`sequelize.sync()`).

## Formulario de contacto

- Se valida en el cliente (`client/src/lib/validateContact.ts`) y en el servidor con Zod.
- Anti-spam:
  - **Honeypot**: un campo `website` oculto. Si llega relleno, el mensaje se descarta en silencio.
  - **Rate limit**: 5 envíos cada 15 minutos por IP.
- La interfaz muestra los estados de envío, éxito y error, y los anuncia a los lectores de pantalla.

| `MAIL_PROVIDER` | Qué hace | Qué necesita |
|---|---|---|
| `test` (por defecto) | No envía nada: muestra el mensaje en la consola del back y lo guarda en `server/outbox/messages.jsonl` | Nada |
| `resend` | Envía con la API de [Resend](https://resend.com) | `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` |
| `smtp` | Envía con Nodemailer (Gmail, Outlook, etc.) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO` |

Si eliges `resend` o `smtp` y faltan las credenciales, el servidor avisa en la consola y vuelve al modo `test`. Para saber qué modo está activo, abre `GET /api/health`.

- **Resend:** crea una cuenta y una API key. Pon en `CONTACT_TO` el mismo correo con el que te registraste: sin un dominio verificado, Resend solo entrega a ese correo. Deja `CONTACT_FROM=Portafolio <onboarding@resend.dev>`.
- **Gmail con SMTP:** activa la verificación en dos pasos y crea una "contraseña de aplicación". Úsala como `SMTP_PASS`.

## API

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/projects`, `/api/skills`, `/api/health` | Público |
| POST | `/api/contact` | Público (con rate limit) |
| POST | `/api/admin/login` | Público (con rate limit) |
| GET/POST | `/api/admin/projects`, `/api/admin/skills` | Admin (`Authorization: Bearer <token>`) |
| PUT/DELETE | `/api/admin/projects/:id`, `/api/admin/skills/:id` | Admin |
| POST | `/api/admin/upload` (campo `image`, multipart) | Admin |

Puedes probarla con Postman: haz login, copia el `token` y mándalo en el header `Authorization`.

## Subirlo a GitHub

```bash
cd portafolio
git init
git add .
git commit -m "Portafolio inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/portafolio.git
git push -u origin main
```

`.gitignore` ya excluye `node_modules`, `.env`, la base de datos SQLite, las imágenes subidas y los mensajes de prueba. **Nunca subas tu `server/.env`.**

## Despliegue

### Configuración actual: Netlify (front) + Render (API) + Neon (BD) + Cloudinary (imágenes)

Todo con plan gratuito. `render.yaml` y `netlify.toml` ya traen la configuración.

1. **Neon** ([neon.tech](https://neon.tech)): crea un proyecto y copia la *connection string* (`postgres://...`).
2. **Cloudinary** ([cloudinary.com](https://cloudinary.com)): en el Dashboard copia la *API environment variable* (`cloudinary://...`).
3. **Render** ([render.com](https://render.com)): **New → Blueprint**, elige el repo y rellena las variables que te pide:
   - `DATABASE_URL` (la de Neon)
   - `CLOUDINARY_URL`
   - `ADMIN_USER` y `ADMIN_PASSWORD`
   - `RESEND_API_KEY`
   - `CORS_ORIGIN` (pon cualquier valor por ahora; lo cambias en el paso 5)
4. **Netlify** ([netlify.com](https://netlify.com)): **Add new site → Import from Git**, elige el repo y añade la variable `VITE_API_URL` con la URL de Render (`https://portafolio-api-xxxx.onrender.com`).
5. Vuelve a Render y pon en `CORS_ORIGIN` la URL de Netlify (`https://tu-sitio.netlify.app`).
6. **Copia tus datos locales a producción.** Crea `server/.env.deploy` (no se sube a git) con:
   ```
   DATABASE_URL=postgres://...   (la de Neon)
   DB_SSL=true
   CLOUDINARY_URL=cloudinary://...
   ```
   Después ejecuta:
   ```bash
   npm run db:copy -w server
   ```
   Te enseña qué va a copiar sin tocar nada. Si está bien, ejecuta:
   ```bash
   npm run db:copy -w server -- --yes
   ```
   Sube tus imágenes locales a Cloudinary y **reemplaza** los proyectos y las habilidades de producción.

Con `CLOUDINARY_URL` configurada, lo que subas desde el panel en producción va a Cloudinary y no se pierde aunque Render reinicie el servidor.

### Opción A: un solo servicio en Render, la más simple

El back sirve también el front ya compilado, en el mismo dominio y sin CORS.

1. Crea una base de datos **PostgreSQL** en Render (tiene plan gratuito) y copia su *Internal Database URL*.
2. Crea un **Web Service** a partir del repo:
   - Build command: `npm install --include=dev && npm run build`
   - Start command: `npm start`
3. Variables de entorno:
   - `NODE_ENV=production`
   - `TRUST_PROXY=1`
   - `DATABASE_URL=...`
   - `DB_SSL=false` (la URL interna de Render no usa SSL; si usas la externa, pon `true`)
   - `ADMIN_USER=...`
   - `ADMIN_PASSWORD=...`
   - `SESSION_SECRET=...` (64 caracteres aleatorios)
   - `MAIL_PROVIDER=resend`
   - `RESEND_API_KEY=...`
   - `CONTACT_TO=...`
   - `CONTACT_FROM=...`

> **Imágenes en producción:** el disco de Render (y de Railway o Heroku) se borra en cada despliegue. Tienes dos opciones:
> - Añadir un **Persistent Disk** montado en `/opt/render/project/src/server/uploads`.
> - Pegar enlaces externos en el panel (por ejemplo, imágenes subidas a GitHub, Cloudinary o Imgur).

### Opción B: front en Vercel y back en Render

1. **Back (Render):** igual que en la opción A, pero añade `CORS_ORIGIN=https://tu-portafolio.vercel.app`.
2. **Front (Vercel):** importa el repo y configura:
   - Root directory: `client`
   - Framework: Vite
   - Variable de entorno: `VITE_API_URL=https://tu-api.onrender.com`

   El `vercel.json` ya hace que `/admin` funcione.

> En el plan gratuito, Render apaga el servicio cuando no tiene uso. Por eso la primera visita tras un rato puede tardar unos 30 segundos.

### Dominio propio

Añade el dominio en Vercel o en Render y verifícalo también en Resend. Así podrás enviar desde `contacto@tudominio.com` a cualquier correo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Front y back en modo desarrollo |
| `npm run build` | Compila el front (`client/dist`) y el back (`server/dist`) |
| `npm start` | Arranca el back compilado (y sirve el front si `NODE_ENV=production`) |
| `npm run typecheck` | Revisa los tipos de los dos proyectos |
