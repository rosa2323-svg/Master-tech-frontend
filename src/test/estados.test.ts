import { afterEach, describe, expect, it, vi } from 'vitest'
import { ESTADOS_DESPACHO, claseEstado, esAtrasado } from '../utils/estados'
import { categoriaPorPalabra, categoriaPorSlug, rutaCategoria } from '../utils/categorias'

describe('estados', () => {
  afterEach(() => vi.useRealTimers())

  it('cada estado del flujo tiene su propia clase y uno desconocido usa la neutra', () => {
    expect(claseEstado('Pagado')).toBe('bg-primary')
    expect(claseEstado('ANULADA')).toBe('bg-danger')
    expect(claseEstado('Inventado')).toBe('bg-secondary')
  })

  it('el flujo de despacho termina en Entregado', () => {
    expect(ESTADOS_DESPACHO[0]).toBe('Pagado')
    expect(ESTADOS_DESPACHO[ESTADOS_DESPACHO.length - 1]).toBe('Entregado')
  })

  it('esAtrasado compara con la fecha local de hoy', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 11, 10, 12, 0, 0))

    expect(esAtrasado('2026-12-09', 'Preparando')).toBe(true)
    expect(esAtrasado('2026-12-10', 'Preparando')).toBe(false)
    expect(esAtrasado('2026-12-11', 'Preparando')).toBe(false)
  })

  it('un pedido entregado, anulado o sin fecha nunca está atrasado', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 11, 10))

    expect(esAtrasado('2026-01-01', 'Entregado')).toBe(false)
    expect(esAtrasado('2026-01-01', 'ANULADA')).toBe(false)
    expect(esAtrasado(null, 'Pagado')).toBe(false)
    expect(esAtrasado(undefined, 'Pagado')).toBe(false)
  })
})

describe('categorias', () => {
  const cats = [
    { id: 1, nombre: 'Computación' },
    { id: 2, nombre: 'Audio y Sonido' },
  ]

  it('rutaCategoria y categoriaPorSlug son inversas', () => {
    expect(rutaCategoria(cats[0])).toBe('/categoria/computacion')
    expect(categoriaPorSlug(cats, 'audio-y-sonido')?.id).toBe(2)
    expect(categoriaPorSlug(cats, undefined)).toBeUndefined()
  })

  it('categoriaPorPalabra ignora tildes y mayúsculas', () => {
    expect(categoriaPorPalabra(cats, 'COMPUTACION')?.id).toBe(1)
    expect(categoriaPorPalabra(cats, 'xyz', 'sonido')?.id).toBe(2)
    expect(categoriaPorPalabra(cats, 'xyz')).toBeUndefined()
  })
})
