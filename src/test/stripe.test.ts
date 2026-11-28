import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Stripe solo admite un pago incrustado a la vez: con React StrictMode el componente se monta, desmonta y vuelve a
 * montar. La cola de utils/stripe.ts debe esperar a que el anterior se destruya antes de crear el siguiente.
 */
describe('cola del pago incrustado de Stripe', () => {
  let eventos: string[]
  let numero: number

  beforeEach(() => {
    eventos = []
    numero = 0
    vi.resetModules()
    const initEmbeddedCheckout = vi.fn(async () => {
      const id = ++numero
      eventos.push(`crear ${id}`)
      return { mount: vi.fn(), unmount: vi.fn(), destroy: vi.fn(() => { eventos.push(`destruir ${id}`) }) }
    })
    vi.stubGlobal('window', { Stripe: () => ({ initEmbeddedCheckout }) })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('crea el segundo pago solo después de destruir el primero', async () => {
    const { iniciarCheckoutIncrustado, destruirCheckoutIncrustado } = await import('../utils/stripe')

    const primero = iniciarCheckoutIncrustado('pk_test', 'secreto')
    destruirCheckoutIncrustado(primero)
    const segundo = iniciarCheckoutIncrustado('pk_test', 'secreto')
    await segundo

    expect(eventos).toEqual(['crear 1', 'destruir 1', 'crear 2'])
  })

  it('un fallo al crear no bloquea la cola', async () => {
    vi.stubGlobal('window', { Stripe: () => ({ initEmbeddedCheckout: vi.fn().mockRejectedValueOnce(new Error('falló')).mockResolvedValue({ destroy: vi.fn() }) }) })
    const { iniciarCheckoutIncrustado } = await import('../utils/stripe')

    await expect(iniciarCheckoutIncrustado('pk_test', 'a')).rejects.toThrow('falló')
    await expect(iniciarCheckoutIncrustado('pk_test', 'b')).resolves.toBeDefined()
  })
})
