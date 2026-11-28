import { describe, expect, it } from 'vitest'
import { IMG_DEFECTO, formatoDiaLargo, formatoFecha, formatoSoles, imagenProducto, marcaDe, normalizar, slugify, textoEntrega } from '../utils/format'

describe('format', () => {
  it('formatoSoles usa dos decimales y el prefijo S/', () => {
    expect(formatoSoles(10)).toMatch(/^S\/ 10[.,]00$/)
    expect(formatoSoles(1234.5)).toContain('1')
    expect(formatoSoles(0)).toMatch(/0[.,]00$/)
  })

  it('normalizar quita tildes, mayúsculas y espacios', () => {
    expect(normalizar('  Teclado MECÁNICO ')).toBe('teclado mecanico')
    expect(normalizar(null as unknown as string)).toBe('')
  })

  it('slugify genera rutas limpias', () => {
    expect(slugify('Computación & Laptops')).toBe('computacion-laptops')
    expect(slugify('  --Mouse Gamer--  ')).toBe('mouse-gamer')
  })

  it('imagenProducto: sin imagen usa la de defecto; URL absoluta se respeta; nombre suelto va a /Imagenes', () => {
    expect(imagenProducto(null)).toBe(IMG_DEFECTO)
    expect(imagenProducto('https://x.test/a.png')).toBe('https://x.test/a.png')
    expect(imagenProducto('/img/a.png')).toBe('/img/a.png')
    expect(imagenProducto('mouse.png')).toBe('/Imagenes/mouse.png')
  })

  it('marcaDe devuelve «Sin marca» si falta', () => {
    expect(marcaDe({ marca: null })).toBe('Sin marca')
    expect(marcaDe({ marca: 'Logitech' })).toBe('Logitech')
  })

  it('formatoFecha devuelve un guion si la fecha no es válida', () => {
    expect(formatoFecha('no-es-fecha')).toBe('—')
    expect(formatoFecha('2026-12-02T10:30:00')).not.toBe('—')
  })

  it('formatoDiaLargo no depende de la zona horaria y devuelve el texto original si es inválido', () => {
    expect(formatoDiaLargo('2026-12-02')).toContain('2')
    expect(formatoDiaLargo('2026-12-02').toLowerCase()).toContain('diciembre')
    expect(formatoDiaLargo('basura')).toBe('basura')
  })

  it('textoEntrega distingue un día de un rango', () => {
    expect(textoEntrega('2026-12-02', '2026-12-02')).toMatch(/^el /)
    expect(textoEntrega('2026-12-02', '2026-12-03')).toMatch(/^entre el .* y el /)
  })
})
