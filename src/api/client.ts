import type {
  BotHistorial, BotRespuesta, Categoria, Perfil, Producto, ProductoInput, RegistroData, Rol, Sesion, Usuario, Venta,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8089').replace(/\/$/, '')

/** Servicio del asistente con IA (Python/FastAPI). Valida el MISMO JWT que emite Spring. */
export const BOT_URL = (import.meta.env.VITE_BOT_URL ?? 'http://localhost:8090').replace(/\/$/, '')

const CLAVE_TOKEN = 'mastertech_token'

export const tokenStore = {
  get: () => { try { return localStorage.getItem(CLAVE_TOKEN) } catch { return null } },
  set: (t: string) => { try { localStorage.setItem(CLAVE_TOKEN, t) } catch { /* sin almacenamiento */ } },
  clear: () => { try { localStorage.removeItem(CLAVE_TOKEN) } catch { /* sin almacenamiento */ } },
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// El AuthContext registra aquí qué hacer cuando el backend responde 401 con un token guardado.
let onNoAutorizado: (() => void) | null = null
export function registrarOnNoAutorizado(fn: (() => void) | null) { onNoAutorizado = fn }

interface Opciones {
  method?: string
  body?: unknown
  form?: FormData
}

async function peticion<T>(ruta: string, { method = 'GET', body, form }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let resp: Response
  try {
    resp = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que el backend esté en marcha.')
  }

  if (resp.status === 204) return undefined as T

  const texto = await resp.text()
  let datos: unknown = null
  if (texto) { try { datos = JSON.parse(texto) } catch { datos = null } }

  if (!resp.ok) {
    const d = (datos ?? {}) as { message?: string; error?: string }
    const mensaje = d.message || d.error || `Error ${resp.status}`
    if (resp.status === 401 && token && ruta !== '/api/auth/login') onNoAutorizado?.()
    throw new ApiError(resp.status, mensaje)
  }
  return datos as T
}

const get = <T,>(r: string) => peticion<T>(r)
const send = <T,>(method: string, r: string, body?: unknown) => peticion<T>(r, { method, body })

export const api = {
  // Autenticación
  login: (email: string, password: string) => send<Sesion>('POST', '/api/auth/login', { email, password }),
  registro: (d: RegistroData) => send<{ mensaje: string }>('POST', '/api/auth/registro', d),
  me: () => get<Omit<Sesion, 'token'>>('/api/auth/me'),

  // Catálogo (público)
  productos: () => get<Producto[]>('/api/v1/productos'),
  producto: (id: number | string) => get<Producto>(`/api/v1/productos/${id}`),
  categorias: () => get<Categoria[]>('/api/v1/categorias'),

  // Admin: productos
  crearProducto: (d: ProductoInput) => send<Producto>('POST', '/api/v1/productos', d),
  actualizarProducto: (id: number, d: ProductoInput) => send<Producto>('PUT', `/api/v1/productos/${id}`, d),
  eliminarProducto: (id: number) => send<void>('DELETE', `/api/v1/productos/${id}`),
  subirImagenProducto: (id: number, archivo: File) => {
    const form = new FormData()
    form.append('imagen', archivo)
    return peticion<Producto>(`/api/v1/productos/${id}/imagen`, { method: 'POST', form })
  },

  // Admin: categorías
  crearCategoria: (d: { nombre: string; descripcion?: string }) => send<Categoria>('POST', '/api/v1/categorias', d),
  actualizarCategoria: (id: number, d: { nombre: string; descripcion?: string }) =>
    send<Categoria>('PUT', `/api/v1/categorias/${id}`, d),
  eliminarCategoria: (id: number) => send<void>('DELETE', `/api/v1/categorias/${id}`),

  // Admin: usuarios y ventas
  usuarios: () => get<Usuario[]>('/api/v1/usuarios'),
  cambiarRol: (id: number, rol: Rol) => send<Usuario>('PATCH', `/api/v1/usuarios/${id}`, { rol }),
  eliminarUsuario: (id: number) => send<void>('DELETE', `/api/v1/usuarios/${id}`),
  ventas: () => get<Venta[]>('/api/v1/ventas'),

  // Cliente autenticado
  miPerfil: () => get<Perfil>('/api/v1/me'),
  actualizarPerfil: (d: { nombre: string; direccion: string; numeroTelefono: string; biografia: string }) =>
    send<Perfil>('PUT', '/api/v1/me', d),
  cambiarPassword: (d: { passwordActual: string; passwordNuevo: string; passwordConfirm: string }) =>
    send<{ mensaje: string }>('PUT', '/api/v1/me/password', d),
  misPedidos: () => get<Venta[]>('/api/v1/me/pedidos'),

  // Pago
  checkout: (items: { productoId: number; cantidad: number }[]) =>
    send<{ url: string }>('POST', '/api/v1/pedidos/checkout', { items }),
  confirmarPago: (sessionId: string) => send<Venta>('POST', '/api/v1/pedidos/confirmar', { sessionId }),
}


const ESPERA_BOT_MS = 60_000

async function peticionBot<T>(ruta: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const control = new AbortController()
  const reloj = setTimeout(() => control.abort(), ESPERA_BOT_MS)
  let resp: Response
  try {
    resp = await fetch(`${BOT_URL}${ruta}`, {
      method, headers, signal: control.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el asistente.')
  } finally {
    clearTimeout(reloj)
  }

  if (resp.status === 204) return undefined as T
  const texto = await resp.text()
  let datos: unknown = null
  if (texto) { try { datos = JSON.parse(texto) } catch { datos = null } }

  if (!resp.ok) {
    // FastAPI: { detail: "..." } (errores propios) o { detail: [ ... ] } (validación 422)
    const detalle = (datos as { detail?: unknown } | null)?.detail
    throw new ApiError(resp.status, typeof detalle === 'string' ? detalle : `Error ${resp.status}`)
  }
  return datos as T
}

export const bot = {
  /** Última conversación del cliente (para repintar el chat al volver). */
  historial: () => peticionBot<BotHistorial>('/history'),
  /** `nueva: true` abre una conversación nueva; si no, el servidor retoma la última. */
  chat: (message: string, conversationId: string | null, nueva: boolean) =>
    peticionBot<BotRespuesta>('/chat', { method: 'POST', body: { message, conversation_id: conversationId, new: nueva } }),
  /** Borra el historial y las preferencias que el asistente guardó del cliente. */
  olvidarme: () => peticionBot<void>('/me/data', { method: 'DELETE' }),
}
