/** Clases de Bootstrap para el distintivo de cada estado de un pedido. */
const CLASE_ESTADO: Record<string, string> = {
  Pagado: 'bg-primary',
  Preparando: 'bg-warning text-dark',
  'En ruta': 'bg-info text-dark',
  'Listo para recoger': 'bg-info text-dark',
  Entregado: 'bg-success',
  ANULADA: 'bg-danger',
}

export const claseEstado = (estado: string) => CLASE_ESTADO[estado] ?? 'bg-secondary'

/** Estados del panel de despacho, en orden. */
export const ESTADOS_DESPACHO = ['Pagado', 'Preparando', 'En ruta', 'Listo para recoger', 'Entregado']

/** "2026-12-02" < hoy (en la fecha local del navegador). */
export function esAtrasado(fechaEstimada: string | null | undefined, estado: string) {
  if (!fechaEstimada || estado === 'Entregado' || estado === 'ANULADA') return false
  const h = new Date()
  const hoy = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
  return fechaEstimada < hoy
}
