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

/** Prepara el pago incrustado de Stripe con el secreto de la sesión creada en el backend. */
export async function iniciarCheckoutIncrustado(clavePublica: string, clientSecret: string): Promise<CheckoutIncrustado> {
  await cargarStripeJs()
  if (!window.Stripe) throw new Error('Stripe no está disponible.')
  return window.Stripe(clavePublica).initEmbeddedCheckout({ clientSecret })
}
