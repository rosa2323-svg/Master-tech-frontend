export interface Producto {
  id: number
  nombre: string
  descripcion?: string | null
  precio: number
  marca?: string | null
  imagenUrl?: string | null
  stock: number
  categoriaId: number
  categoriaNombre?: string | null
}

export interface ProductoInput {
  nombre: string
  descripcion?: string
  precio: number
  marca: string
  stock: number
  categoriaId: number
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string | null
  imagenUrl?: string | null
}

export type Rol = 'USER' | 'ADMIN'

export interface Sesion {
  token: string
  id: number
  email: string
  nombre: string
  rol: Rol
}

export interface DetalleVenta {
  id: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  productoId: number
  productoNombre: string
  productoImagenUrl?: string | null
}

export interface Venta {
  id: number
  fecha: string
  total: number
  cantidadItems: number
  numeroOrden: string
  estado: string
  usuarioId?: number
  usuarioNombre?: string
  usuarioEmail?: string
  detalles: DetalleVenta[]
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  dni?: string | null
  direccion?: string | null
  numeroTelefono?: string | null
  fechaRegistro?: string | null
}

export type Perfil = Usuario

export interface RegistroData {
  nombre: string
  email: string
  password: string
  dni: string
  direccion: string
  numeroTelefono: string
}

export type AgrupacionTendencia = 'dia' | 'semana' | 'mes'

export interface PuntoTendencia {
  periodo: string
  etiqueta: string
  ordenes: number
  unidades: number
  ingreso: number
}

// ---- Asistente (bot-core): http://localhost:8090 ----
/** Acción de interfaz que acompaña a una respuesta. Hoy: { type: 'products', ids } = tarjetas de producto. */
export interface BotAccion {
  type: string
  ids?: number[]
}

export interface BotRespuesta {
  conversation_id: string
  text: string
  ui_actions: BotAccion[]
}

export interface BotMensaje {
  role: 'user' | 'assistant'
  text: string
  ui: BotAccion[]
  at: string | null
}

export interface BotHistorial {
  conversation_id: string | null
  messages: BotMensaje[]
}
