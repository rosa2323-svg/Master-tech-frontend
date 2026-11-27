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

export type Rol = 'USER' | 'ADMIN' | 'DESPACHADOR'

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
  /** Próximo estado del flujo (según sea a domicilio o recojo); null si terminó. */
  siguienteEstado?: string | null
  /** Solo en despacho: el cliente pidió reembolso y falta resolverlo. */
  reembolsoPendiente?: boolean
  usuarioId?: number
  usuarioNombre?: string
  usuarioEmail?: string
  usuarioDireccion?: string | null
  usuarioTelefono?: string | null
  tipoEntrega?: 'DOMICILIO' | 'RECOJO'
  costoEnvio?: number
  direccionEntrega?: string | null
  latitudEntrega?: number | null
  longitudEntrega?: number | null
  distanciaKm?: number | null
  puntoRepartoId?: number | null
  puntoRepartoNombre?: string | null
  fechaEstimadaEntrega?: string | null
  fechaEntregaReal?: string | null
  fechaAnulacion?: string | null
  motivoAnulacion?: string | null
  detalles: DetalleVenta[]
}

/** Solicitud de reembolso de un pedido. */
export interface SolicitudReembolso {
  id: number
  ventaId: number
  numeroOrden: string
  usuarioNombre?: string | null
  usuarioEmail?: string | null
  estadoVenta: string
  tipoEntrega?: string | null
  /** Productos + envío. */
  monto: number
  motivo: string
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  fechaSolicitud: string
  fechaResolucion?: string | null
  resueltoPorNombre?: string | null
  notaAdmin?: string | null
}

/** Un paso del historial de un pedido. */
export interface EnvioEvento {
  estado: string
  fecha: string
  usuarioNombre?: string | null
  nota?: string | null
}

/** Dirección de entrega a domicilio enviada al pagar. */
export interface EntregaInput {
  direccion: string
  latitud: number
  longitud: number
}

/** A dónde va (o dónde se recoge) un pedido, para cotizar. */
export type DestinoEnvio =
  | { tipoEntrega: 'DOMICILIO'; latitud: number; longitud: number }
  | { tipoEntrega: 'RECOJO'; puntoRepartoId: number }

/** Entrega elegida al pagar. */
export type EntregaCheckout =
  | { tipoEntrega: 'DOMICILIO'; entrega: EntregaInput }
  | { tipoEntrega: 'RECOJO'; puntoRepartoId: number }

/** Respuesta de /pedidos/cotizar. Si `cubierto` es false solo viene `mensaje`. */
export interface Cotizacion {
  cubierto: boolean
  tipoEntrega?: 'DOMICILIO' | 'RECOJO'
  mensaje?: string | null
  subtotal?: number
  costoEnvio?: number
  total?: number
  envioGratis?: boolean
  distanciaKm?: number
  sedeNombre?: string
  sedeDireccion?: string
  tarifaNombre?: string
  /** YYYY-MM-DD */
  entregaDesde?: string
  /** YYYY-MM-DD */
  entregaHasta?: string
}

/** Sugerencia del autocompletado de direcciones. */
export interface Sugerencia {
  placeId: string
  texto: string
}

/** Dirección confirmada con su ubicación exacta. */
export interface Lugar {
  direccion: string
  latitud: number
  longitud: number
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

export interface ItemVendido {
  id: number
  nombre: string
  unidades: number
  ingreso: number
}

export interface ProductosVendidos {
  totalUnidades: number
  porCategoria: ItemVendido[]
  topProductos: ItemVendido[]
}

export interface IngresoDiario {
  hoy: number
  ayer: number
  variacionPct: number | null
}

export interface IngresoPromedio {
  totalIngreso: number
  ordenes: number
  dias: number
  promedioDiario: number
  ticketPromedio: number
}

export interface ItemConcentracion {
  id: number
  nombre: string
  ingreso: number
  porcentaje: number
}

export interface ConcentracionIngresos {
  totalIngreso: number
  top5Pct: number
  productos: ItemConcentracion[]
  otrosIngreso: number
  otrosPct: number
}

// ---- Envíos: configuración (solo ADMIN) ----
export interface PuntoReparto {
  id: number
  nombre: string
  direccion: string
  latitud: number
  longitud: number
  permiteRecojo: boolean
  activo: boolean
}

export interface PuntoRepartoInput {
  nombre: string
  direccion: string
  latitud: number
  longitud: number
  permiteRecojo: boolean
}

/** Tramo de distancia [desde, hasta) en km, con costo en soles y plazo en días hábiles. */
export interface TarifaEnvio {
  id: number
  nombre: string
  distanciaDesdeKm: number
  distanciaHastaKm: number
  costo: number
  envioGratisDesde: number | null
  diasEntregaMin: number
  diasEntregaMax: number
  activo: boolean
}

export interface TarifaEnvioInput {
  nombre: string
  distanciaDesdeKm: number
  distanciaHastaKm: number
  costo: number
  envioGratisDesde: number | null
  diasEntregaMin: number
  diasEntregaMax: number
}

/** Rango de km que ningún tramo activo cubre. */
export interface HuecoTarifa {
  desdeKm: number
  hastaKm: number
}

export interface ConfigEnvio {
  /** HH:mm (el servidor puede devolver HH:mm:ss). */
  horaCorte: string
  diasPreparacion: number
  zonaHoraria: string
}

export interface Feriado {
  /** AAAA-MM-DD */
  fecha: string
  descripcion: string
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
