import type { Cotizacion, EntregaCheckout } from '../api/types'

export interface SeleccionEntrega {
  /** Lo que se envía a /pedidos/checkout. */
  checkout: EntregaCheckout
  cotizacion: Cotizacion
}
