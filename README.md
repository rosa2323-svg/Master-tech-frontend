# Master Tech — Frontend

Tienda en línea de tecnología con carrito, pago con Stripe, paneles de administración y despacho, y asistente con IA.

**Stack:** React 19 · TypeScript · Vite · React Router · Bootstrap · Chart.js

| Servicio | Local | Render |
|---|---|---|
| [Frontend (este repo)](https://github.com/rosa2323-svg/Master-tech-frontend.git)| http://localhost:5173 | https://herramientas01.onrender.com |
| [Backend Spring Boot](https://github.com/rosa2323-svg/Master-tech-backend) | http://localhost:8089 | https://master-tech-backend.onrender.com |
| [Asistente IA](https://github.com/MaelXDD/Bot_Asitente.git)| http://localhost:8090/mastertech | https://bot-asitente.onrender.com/mastertech |

Arquitectura, rutas y roles, integración con el backend y el bot, despliegue y guía de contribución: [wiki del repositorio](https://github.com/rosa2323-svg/Master-tech-frontend/wiki).

## Puesta en marcha
Requiere Node.js 20+ y el backend (y el bot) en marcha, locales o los de Render.

```bash
npm install
cp .env.example .env     # ajusta las dos variables
npm run dev              # http://localhost:5173
npm run build            # tsc -b + vite build → dist/
```

## Variables de entorno
| Variable | Descripción | Dev |
|---|---|---|
| `VITE_API_URL` | Backend Spring Boot | `http://localhost:8089` |
| `VITE_BOT_URL` | Asistente IA, **debe terminar en `/mastertech`** | `http://localhost:8090/mastertech` |

- Aceptan varias URLs separadas por coma: se usa la primera que responda y, si falla (sin conexión o 502/503/504), la siguiente. Detalle en la [wiki](https://github.com/rosa2323-svg/Master-tech-frontend/wiki/Configuración-y-ejecución-local).
- En Render defínelas **antes** de compilar (Vite las incorpora al build) y deja solo las URLs de Render.
- Quedan visibles en el navegador: nunca pongas claves ni secretos.

## Contribuir
Issue en el tablero → rama desde `develop` (`feature/<nombre>-pr<N>-<tema>`) → commits `feat:`/`fix:`/`docs:` → `npm run build` sin errores → PR hacia `develop` con la plantilla y `Closes #N`.