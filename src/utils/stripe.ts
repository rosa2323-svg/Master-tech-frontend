/** Carga Stripe.js desde la CDN de Stripe una sola vez (Stripe pide no empaquetarlo). */

export interface CheckoutIncrustado {
  mount: (selector: string | HTMLElement) => void
  unmount: () => void
  destroy: () => void
}

interface StripeJs {
  initEmbeddedCheckout: (opciones: { clientSecret: string }) => Promise<CheckoutIncrustado>
}

declare global {
  interface Window {
    Stripe?: (clavePublica: string) => StripeJs
  }
}

const URL_STRIPE_JS = 'https://js.stripe.com/v3/'
let carga: Promise<void> | null = null

function cargarStripeJs(): Promise<void> {
  if (window.Stripe) return Promise.resolve()
  if (!carga) {
    carga = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = URL_STRIPE_JS
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        script.remove()
        carga = null // permite reintentar
        reject(new Error('No se pudo cargar el formulario de pago de Stripe. Revisa tu conexión e inténtalo de nuevo.'))
      }
      document.head.appendChild(script)
    })
  }
  return carga
}

/**
 * Stripe solo admite UN pago incrustado a la vez («You cannot have multiple Embedded Checkout objects»).
 * React en desarrollo monta, desmonta y vuelve a montar los componentes: por eso toda creación espera en esta
 * cola a que el anterior se haya destruido por completo.
 */
let cola: Promise<unknown> = Promise.resolve()

/** Prepara el pago incrustado de Stripe con el secreto de la sesión creada en el backend. */
export function iniciarCheckoutIncrustado(clavePublica: string, clientSecret: string): Promise<CheckoutIncrustado> {
  const promesa = cola.then(async () => {
    await cargarStripeJs()
    if (!window.Stripe) throw new Error('Stripe no está disponible.')
    return window.Stripe(clavePublica).initEmbeddedCheckout({ clientSecret })
  })
  cola = promesa.then(() => undefined, () => undefined)
  return promesa
}

/** Destruye el pago incrustado cuando ya esté creado; el siguiente `iniciarCheckoutIncrustado` espera a que termine. */
export function destruirCheckoutIncrustado(promesa: Promise<CheckoutIncrustado>): void {
  cola = promesa.then(c => c.destroy()).then(() => undefined, () => undefined)
}
