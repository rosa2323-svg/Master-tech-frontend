# Master Tech — Frontend

Tienda en línea de tecnología con carrito, cotización de envío, pago incrustado con Stripe, reembolsos, paneles de administración y despacho, y asistente con IA.

**Stack:** React 19 · TypeScript · Vite · React Router · Bootstrap · Chart.js · Vitest

| Servicio | Local | Render |
|---|---|---|
| [Frontend (este repo)](https://github.com/rosa2323-svg/Master-tech-frontend) | http://localhost:5173 | https://herramientas01.onrender.com |
| [Backend Spring Boot](https://github.com/rosa2323-svg/Master-tech-backend) | http://localhost:8089 | https://master-tech-backend.onrender.com |
| [Asistente IA](https://github.com/MaelXDD/Bot_Asitente.git) | http://localhost:8090/mastertech | https://bot-asitente.onrender.com/mastertech |

## Documentación
Arquitectura, rutas y roles, flujo de compra y reembolsos, integración con el backend y el bot, despliegue y guía de contribución: **[wiki de este repositorio](https://github.com/rosa2323-svg/Master-tech-frontend/wiki)**. La API está documentada en la [wiki del backend](https://github.com/rosa2323-svg/Master-tech-backend/wiki).

## Puesta en marcha
Requiere Node.js 20+ y el backend (y el bot) en marcha, locales o los de Render.

```bash
npm install
cp .env.example .env     # ajusta las variables
npm run dev              # http://localhost:5173
npm run build            # tsc -b + vite build → dist/
npm test                 # pruebas (Vitest)
```

## Variables de entorno
| Variable | Descripción | Dev | Obligatoria |
|---|---|---|---|
| `VITE_API_URL` | Backend Spring Boot | `http://localhost:8089` | Sí |
| `VITE_BOT_URL` | Asistente IA, **debe terminar en `/mastertech`** | `http://localhost:8090/mastertech` | Sí |
| `VITE_GOOGLE_MAPS_BROWSER_KEY` | Clave de **navegador** de Google Maps para el mapa de entrega | — | No (sin ella no hay mapa; el buscador de direcciones sigue funcionando) |
| `VITE_GOOGLE_MAP_ID` | ID de mapa propio | — | No (por defecto `DEMO_MAP_ID`) |

- `VITE_API_URL` y `VITE_BOT_URL` aceptan varias URLs separadas por coma: se usa la primera que responda y, si falla (sin conexión o 502/503/504), la siguiente. Solo las lecturas (GET) saltan de servidor. Detalle en la [wiki](https://github.com/rosa2323-svg/Master-tech-frontend/wiki/Configuración-y-ejecución-local).
- En Render defínelas **antes** de compilar (Vite las incorpora al build), deja solo las URLs de Render y redespliega al cambiarlas.
- Quedan visibles en el navegador: nunca pongas claves secretas ni secretos.

## Despliegue
Static Site en Render: build `npm ci && npm run build`, publicar `dist`, y regla de reescritura `/*` → `/index.html`. Pasos completos en la [wiki](https://github.com/rosa2323-svg/Master-tech-frontend/wiki/Despliegue).

## Contribuir
Issue en el tablero → rama desde `develop` (`feature/<nombre>-pr<N>-<tema>`) → commits `feat:`/`fix:`/`docs:` → `npm run build` y `npm test` sin errores → PR hacia `develop` con la plantilla y `Closes #N`. El CI (`frontend-ci.yml`) debe estar en verde.
