import type { Producto } from '../api/types'

export const formatoSoles = (n: number) =>
    'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const normalizar = (t: string) =>
    String(t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export const slugify = (t: string) =>
    normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const IMG_DEFECTO = 'https://fgxhqbwqjypgxwwafgam.supabase.co/storage/v1/object/public/Productos/placeholder.jpeg'

export function imagenProducto(url?: string | null): string {
  if (!url) return IMG_DEFECTO
  if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url
  return `/Imagenes/${url}`
}

export const marcaDe = (p: Pick<Producto, 'marca'>) => p.marca || 'Sin marca'

export const STOCK_BAJO = 5

export function formatoFecha(iso: string) {
  const f = new Date(iso)
  return isNaN(f.getTime())
      ? '—'
      : f.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** "2026-12-02" → "miércoles 2 de diciembre" (sin pasar por zonas horarias). */
export function formatoDiaLargo(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number)
  const f = new Date(a, m - 1, d)
  return isNaN(f.getTime()) ? fecha : f.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Texto para la fecha estimada: un día o un rango. */
export function textoEntrega(desde: string, hasta: string) {
  return desde === hasta ? `el ${formatoDiaLargo(desde)}` : `entre el ${formatoDiaLargo(desde)} y el ${formatoDiaLargo(hasta)}`
}
