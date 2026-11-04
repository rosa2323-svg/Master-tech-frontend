# Master Tech — Frontend (React + TypeScript + Vite)

Migración del front HTML/CSS/JS (`Herramientas01`) a React, conectado al backend Spring Boot.

## Ejecutar
```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:8089 · VITE_BOT_URL=http://localhost:8090
npm run dev              # http://localhost:5173
npm run build            # genera dist/
```
El backend debe estar en marcha y con `FRONTEND_URL=http://localhost:5173` (CORS + redirecciones de Stripe).

## Asistente con IA
El chat flotante (`src/components/Chatbot.tsx`) habla con el servicio **bot-core** (FastAPI + Gemini, `VITE_BOT_URL`) enviando el mismo JWT de la sesión.
Requiere haber iniciado sesión: el historial y las preferencias de cada cliente se guardan en el servidor (no en el navegador).
Al abrir el chat se repinta la última conversación; el botón ↺ abre una nueva y 🗑 borra el historial y lo que el asistente recuerda.
El bot **no** agrega al carrito ni cobra: muestra tarjetas de producto con "Ver" y "Agregar". Detalles en `bot-core/README.md`.

## Estructura
- `src/api/` cliente `fetch` con JWT (`client.ts`) y tipos (`types.ts`)
- `src/context/` sesión (JWT), catálogo, carrito (localStorage) y alertas
- `src/components/` Navbar, Footer, LoginModal, Chatbot, ProductCard, rutas protegidas, layout admin
- `src/pages/` tienda: Home, Category, Search, ProductDetail, Cart, PagoConfirmar, Register, Profile, Nosotros, Mision, Terminos
- `src/pages/admin/` Productos, Categorías, Ventas, Dashboard, Usuarios (solo rol ADMIN)

## Flujo de compra
Carrito en el navegador → `POST /api/v1/pedidos/checkout` (precios y stock se validan en el servidor) → Stripe Checkout → vuelve a `/pago/confirmar` → `POST /api/v1/pedidos/confirmar` registra la venta y descuenta stock.

## Rutas
`/` · `/categoria/:slug` · `/buscar?query=` · `/producto/:id` · `/carrito` · `/registro` · `/perfil` · `/nosotros` · `/mision` · `/terminos` · `/admin/{productos,categorias,ventas,dashboard,usuarios}`
