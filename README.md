# Frontend — Sistema de Gestión de Citas del Centro de Salud Acapulco

Aplicación académica creada con React y Vite. El código está en [`gestion-citas-frontend/`](gestion-citas-frontend/).

## Inicio local

```bash
cd gestion-citas-frontend
npm install
npm run dev
```

## Despliegue

- **Render (sitio estático):** repositorio `https://github.com/BrayanAlexis01/frontend-clinica`, rama `main`, comando `cd gestion-citas-frontend && npm install && npm run build`, publicación `gestion-citas-frontend/dist`.
- **Netlify:** importar este repositorio; la configuración raíz `netlify.toml` define la carpeta y el build.
- **Vercel:** usar `gestion-citas-frontend` como Root Directory; ejecutar `npm run build`, output `dist`.

`VITE_API_URL` define la URL HTTPS del backend. **Las rutas del adaptador (`src/api.js`) aún deben compararse con los endpoints reales de Spring Boot.** No se ha validado conexión de extremo a extremo con Neon. No colocar contraseñas de base de datos, claves JWT ni datos sensibles en variables `VITE_*`.

Consulta [la documentación del frontend](gestion-citas-frontend/README.md) para las pantallas y los pasos de integración.
