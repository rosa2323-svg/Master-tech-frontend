# bot-core — chatbot IA reutilizable

## Proyecto `mastertech` (tienda Master Tech)

Asistente con Gemini que conoce el catálogo en vivo, el historial de compras de cada cliente y lo que el cliente
le ha contado (uso, presupuesto, marca favorita…). Todo vive en `projects/mastertech/`:

| Archivo | Qué hace |
|---|---|
| `prompt.md` | Personalidad, políticas de la tienda (envío, garantía, devoluciones) y límites. Edítalo sin tocar código. |
| `tools.py` | `buscar_productos`, `detalle_producto`, `comparar_productos`, `listar_categorias`, `mis_compras`, `recomendaciones_para_mi` (+ `recordar_dato` / `olvidar_dato` del motor). Solo lectura. |
| `project.py` | Preferencias que recuerda (`fact_keys`) y el **contexto personal** que se inyecta en cada mensaje. |
| `backend.py` | Cliente de la API Spring (catálogo público con caché corto; `/me` y `/me/pedidos` con el JWT del cliente). |
| `specs.py` | Lee la tabla `especificaciones` (opcional: si no existe, el bot sigue sin ella). |
| `catalog.py` | Búsqueda (sin tildes, plurales, sinónimos), fichas y puntuación de recomendaciones. Sin red. |

**Memoria por usuario** (esquema `bot` de la misma BD, no toca `public`):
`bot.users` (un registro por cliente, clave = correo del JWT) · `bot.conversations` + `bot.messages` (historial completo,
con las tarjetas de producto para repintarlo) · `bot.user_facts` (preferencias duraderas) · `bot.tool_audit` (qué consultó el bot).
Cada mensaje: el modelo ve los últimos `BOT_HISTORY_MESSAGES` + un resumen de lo anterior + las preferencias + el historial de compras.
Al volver, `GET /history` devuelve la última conversación (si tiene menos de `BOT_RESUME_DAYS` días) y `POST /chat` la retoma sola;
`{"new": true}` empieza una nueva (las preferencias se conservan). `DELETE /me/data` borra todo lo que el bot sabe del cliente.

**Qué NO recibe el modelo:** DNI, teléfono, dirección, correo ni contraseña. Solo nombre, fecha de alta y compras.

### Poner en marcha con Spring
1. En Spring y en el bot usa el **mismo** secreto: `JWT_SECRET` (Spring) = `BOT_JWT_SECRET` (bot).
2. `cp .env.example .env` y rellena `GEMINI_API_KEY`, `BOT_DATABASE_URL` (la BD de Mastertech), `BOT_JWT_SECRET`.
3. `python -m bot_core.migrate` (crea/actualiza el esquema `bot`; es idempotente, también para añadir la columna `ui`).
4. `uvicorn main:app --port 8090` → `http://localhost:8090/health` debe responder `{"status":"ok","project":"mastertech"}`.
5. Frontend: `VITE_BOT_URL=http://localhost:8090`. En producción añade la URL del frontend a `BOT_CORS_ORIGINS`.
Spring no necesita cambios de código.

---

Servicio FastAPI + Gemini. El **núcleo** (`bot_core/`) no sabe nada de la tienda: aporta JWT, memoria de
preferencias, auditoría, confirmación de acciones, límite de uso y la API. Cada proyecto aporta solo
una carpeta en `projects/<nombre>/` (`mastertech` es el activo; `citas` queda como ejemplo).

## Arrancar (Master Tech)
```bat
cd bot-core
python -m venv .venv
.venv\Scripts\activate                 :: Linux/Mac: source .venv/bin/activate
python -m pip install -r requirements.txt
copy .env.example .env                  :: rellena GEMINI_API_KEY, BOT_DATABASE_URL, BOT_JWT_SECRET
python -m bot_core.migrate              :: crea el esquema "bot" (una vez)
python run.py                           :: puerto 8090 (en Windows usa run.py, no uvicorn directo)
```
Spring (puerto 8089) debe usar el **mismo** secreto: `JWT_SECRET` = `BOT_JWT_SECRET` (≥ 32 caracteres).
Comprueba: `http://localhost:8090/health` → `{"status":"ok","project":"mastertech"}`.

Flujo: login Spring (`/api/auth/login`) → devuelve `token` → el frontend lo guarda y lo envía a `VITE_BOT_URL`
(`/chat`, `/history`) → el bot valida el JWT y lee de Spring (`/api/v1/productos`, `/api/v1/me`, `/api/v1/me/pedidos`)
reenviando ese mismo JWT.

## Reutilizarlo en otro proyecto
1. Copia `bot-core/` entero (o publícalo como repo propio).
2. `cp -r projects/_template projects/mi_proyecto` y edita `project.py`:
   prompt, `fact_keys`, `load_context()` y tus tools con `@self.registry.tool(...)`
   (`confirm=True` para acciones que modifican datos).
3. `.env`: `BOT_PROJECT=mi_proyecto` y, si tu JWT usa otros nombres, `BOT_JWT_ROLE_CLAIM` / `BOT_JWT_NAME_CLAIM`.
4. Tu backend debe emitir un JWT HMAC (HS256/384/512) con `sub`, `exp` (y `iss` si configuras `BOT_JWT_ISSUER`).
5. En el front llama a `/chat` y `/history` del servicio enviando el JWT en `Authorization: Bearer`.
La BD es la misma del proyecto, pero el bot usa su propio schema `bot` (no se mezcla con `public`). Varios proyectos pueden compartirlo: se separan por `project_id`.

## Tests
`pip install -r requirements.txt && pytest`
