# Sistema de Gestión de Citas — Frontend

Frontend responsive en React 18 + Vite para el Centro de Salud Acapulco — DIRESA Callao.

## Funciones incluidas
- Página de inicio, navegación responsive y diseño institucional.
- Registro e inicio de sesión con JWT.
- Formulario de reserva de citas.
- Listado de médicos y especialidades obtenido desde la API.
- Mis citas: listado, cancelación, reprogramación.
- Mensajes de errores de servidor, validaciones básicas y diseño adaptable a celular.

**IMPORTANTE:** Es un frontend funcional listo para integrar, NO una integración comprobada: no se tuvo acceso al repositorio original ni al Swagger de la API de Render. Las rutas y los formatos de datos en `src/api.js`, incluyendo login, registro, disponibilidad, citas, reprogramación y cancelación, son **supuestos** y deben contrastarse con la API real. La lista de especialidades cuando no responde el backend es solo una ayuda visual; no representa disponibilidad. No usar datos personales reales hasta completar pruebas y seguridad.

## Cómo ejecutar en VS Code

1. Instala Node.js 20 o superior.
2. Abre esta carpeta y ejecuta `npm install`.
3. Copia `.env.example` a `.env.local` si necesitas cambiar la URL del backend.
4. Ejecuta `npm run dev` y abre la URL indicada por Vite.
5. Para compilar: `npm run build`.

## Integración con el backend en Render

- URL conocida del informe: `https://sistema-gestion-citas.onrender.com`.
- Consulta `https://sistema-gestion-citas.onrender.com/swagger-ui/index.html` o `/v3/api-docs` **si esos recursos están habilitados**.
- Edita `ROUTES` y las funciones en `src/api.js` según las rutas y métodos reales, y adapta los campos enviados/recibidos.
- Verifica autenticación JWT, nombres de propiedades, fechas, estados y permisos.
- En Spring Security configura CORS para el dominio del frontend (`https://<tu-app>.netlify.app`), métodos y cabeceras incluyendo `Authorization`.
- Nunca incluyas contraseñas de Neon o secretos de Spring en el frontend ni en variables `VITE_*`.
- Para producción utiliza HTTPS y revisa autorización por paciente en el backend.

## Publicar gratis en Netlify (sencillo)

1. Crea un repositorio de GitHub con esta carpeta y haz push.
2. En Netlify: **Add new project > Import an existing project > GitHub**.
3. Selecciona el repositorio; comando de build: `npm run build`; carpeta publish: `dist`.
4. En variables de entorno añade `VITE_API_URL=https://sistema-gestion-citas.onrender.com`.
5. Pulsa Deploy. Netlify proporcionará una URL pública HTTPS.
6. Configura el dominio obtenido como origen permitido en CORS del backend de Render.
7. Prueba de extremo a extremo: registro, login, médicos, nueva cita, listado, reprogramación y cancelación.

Se incluye `netlify.toml` para redirigir rutas a `index.html`. Alternativamente en Vercel: build `npm run build`, output `dist`, y la misma variable `VITE_API_URL` (incluye `vercel.json`).

## Estado
✅ Código del frontend preparado.
⚠️ Integración con backend pendiente de verificación Swagger.
⚠️ Despliegue público pendiente de conectar repositorio y servicio de hosting.
