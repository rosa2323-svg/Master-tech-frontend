# Master Tech — Frontend

Tienda en línea de tecnología con panel de administración y asistente con IA.
Hecho con **React 19 + TypeScript + Vite**, conectado al backend Spring Boot y al bot de IA (FastAPI + Gemini).

| Servicio | Local | Producción (Render) |
|---|---|---|
| Frontend (este repo) | http://localhost:5173 | https://herramientas01.onrender.com |
| Backend Spring Boot | http://localhost:8089 | https://temporal-l5hx.onrender.com |
| Asistente IA (`bot-core`) | http://localhost:8090 | https://bot-asitente.onrender.com |

## Requisitos
- Node.js 20 o superior y npm
- Backend y bot en marcha (locales o los de Render)

## Puesta en marcha
```bash
npm install
cp .env.example .env     # ajusta VITE_API_URL y VITE_BOT_URL
npm run dev              # http://localhost:5173
npm run build            # tsc -b + vite build → dist/
npm run preview          # sirve dist/ para probar el build
```

### Variables de entorno
| Variable | Descripción | Por defecto (dev) |
|---|---|---|
| `VITE_API_URL` | URL del backend Spring Boot | `http://localhost:8089` |
| `VITE_BOT_URL` | URL del asistente con IA | `http://localhost:8090` |

- Cada variable acepta **varias URLs separadas por coma** (ver [Respaldo automático](#respaldo-automático-entre-local-y-render)).
- Desarrollo: se leen de `.env` (no se sube a git; parte de `.env.example`).
- Producción: define `VITE_API_URL` y `VITE_BOT_URL` en el panel de Render (sección *Environment*) **antes** de compilar. Los archivos `.env.*` no se suben a git (solo `.env.example`).
- Las variables `VITE_*` quedan visibles en el navegador: **nunca** pongas claves ni secretos aquí.

## Respaldo automático entre local y Render
Para desarrollo, en `.env`:
```
VITE_API_URL=http://localhost:8089,https://temporal-l5hx.onrender.com
VITE_BOT_URL=http://localhost:8090,https://bot-asitente.onrender.com
```
- Se prueba la primera URL; si **no hay conexión** (servidor apagado) o responde **502/503/504**, se pasa a la siguiente. Se recuerda la última que funcionó.
- Un 401, 404 o 500 es una respuesta real del servidor y **no** se reintenta en otro.
- Las peticiones GET esperan 6 s a una URL antes de pasar a la siguiente; las que modifican datos (POST/PUT/DELETE) no se cortan por tiempo, para no duplicarlas.
- Pon primero la URL que falla rápido cuando está caída (local) y al final la de Render, que puede tardar ~1 min en despertar.

Límites a tener en cuenta:
- **Mismo `JWT_SECRET` en local y Render.** Si no, el token de un servidor da 401 en el otro y se cierra la sesión.
- **Datos distintos:** local y Render usan bases de datos diferentes (productos, usuarios, historial del chat).
- **En producción deja solo las URLs de Render:** los visitantes no tienen servidor en su `localhost`, y algunos navegadores bloquean llamadas a `localhost` desde una página `https`.

## Conexión con otros servicios

### Backend (Spring Boot)
El cliente `fetch` está en `src/api/client.ts` y envía el JWT de la sesión en `Authorization: Bearer <token>`.
El backend debe tener `FRONTEND_URL` con la URL del front (CORS y redirecciones de Stripe):
`http://localhost:5173` en local y `https://herramientas01.onrender.com` en producción.

### Asistente con IA (bot-core)
El chat flotante (`src/components/Chatbot.tsx`) usa `VITE_BOT_URL` y envía **el mismo JWT** que emite Spring.
Para que funcione:
1. El bot debe tener el mismo secreto que Spring: `BOT_JWT_SECRET` = `JWT_SECRET` (mínimo 32 caracteres).
2. El bot debe permitir el origen del front en CORS: `BOT_CORS_ORIGINS=https://herramientas01.onrender.com` (varios, separados por coma; añade `http://localhost:5173` para pruebas locales).
3. El bot debe apuntar al backend: `MASTERTECH_API_URL=https://temporal-l5hx.onrender.com`.
4. Comprobación: abrir `https://bot-asitente.onrender.com/health` debe responder `{"status":"ok","project":"mastertech"}`.

Comportamiento del chat:
- Requiere haber iniciado sesión. El historial y las preferencias se guardan en el servidor, no en el navegador.
- Al abrir el chat se repinta la última conversación; el botón de reinicio abre una nueva y el de papelera borra el historial y lo que el asistente recuerda.
- El bot **no** agrega al carrito ni cobra: muestra tarjetas de producto con "Ver" y "Agregar".
- En el plan gratuito de Render el servicio se duerme tras un rato sin uso: **la primera respuesta puede tardar cerca de un minuto**. El front espera hasta 65 s antes de mostrar un error.

Detalles del bot en [`bot-core/README.md`](bot-core/README.md).

## Estructura
```
src/
├── api/         cliente fetch con JWT (client.ts) y tipos (types.ts)
├── context/     sesión (JWT), catálogo, carrito (localStorage) y alertas
├── components/  Navbar, Footer, LoginModal, Chatbot, ProductCard, ProtectedRoute, layouts
├── pages/       tienda: Home, Category, Search, ProductDetail, Cart, PagoConfirmar, Register, Profile, Nosotros, Mision, Terminos
├── pages/admin/ Productos, Categorías, Ventas, Dashboard, Usuarios (solo rol ADMIN)
├── styles/      estilos globales, del admin y del chatbot
└── utils/       formato de moneda/imágenes y categorías
bot-core/        servicio del asistente (Python); se despliega por separado
```

## Rutas
| Ruta | Acceso |
|---|---|
| `/`, `/categoria/:slug`, `/buscar?query=`, `/producto/:id`, `/carrito`, `/registro`, `/nosotros`, `/mision`, `/terminos` | Público |
| `/perfil`, `/pago/confirmar` | Sesión iniciada |
| `/admin/{productos,categorias,ventas,dashboard,usuarios}` | Solo rol `ADMIN` |

## Flujo de compra
Carrito en el navegador → `POST /api/v1/pedidos/checkout` (precios y stock se validan en el servidor) → Stripe Checkout → vuelve a `/pago/confirmar` → `POST /api/v1/pedidos/confirmar` registra la venta y descuenta stock.

## Despliegue en Render
Sitio estático:
- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **Rewrite** (para React Router): `/*` → `/index.html` (acción *Rewrite*)
- Variables (obligatorias): `VITE_API_URL=https://temporal-l5hx.onrender.com` y `VITE_BOT_URL=https://bot-asitente.onrender.com`. Sin ellas el build apunta a `localhost` y nada conecta. Tras cambiarlas hay que volver a desplegar, porque Vite las incorpora al compilar.

## Contribuir
1. Crea o elige un issue en el tablero del proyecto.
2. Rama desde `main`: `feature/<nombre>-pr<N>-<tema>`.
3. Commits con prefijo convencional: `feat:`, `fix:`, `docs:`, `refactor:`.
4. Abre el PR con la plantilla y enlaza el issue con `Closes #N`.
