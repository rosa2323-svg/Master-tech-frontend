/**
 * Carga Google Maps JavaScript API una sola vez. Usa una clave DE NAVEGADOR (VITE_GOOGLE_MAPS_BROWSER_KEY):
 * distinta de la del servidor, con solo «Maps JavaScript API» y restringida por referente HTTP.
 */

export interface Punto { lat: number; lng: number }

type Numero = number | (() => number)

export interface MapaGoogle {
  panTo: (p: Punto) => void
  getZoom: () => number | undefined
  setZoom: (z: number) => void
  addListener: (evento: string, cb: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => void
}

export interface MarcadorGoogle {
  position: { lat: Numero; lng: Numero } | null | undefined
  map: MapaGoogle | null
  addListener: (evento: string, cb: () => void) => void
}

interface BibliotecaMapas { Map: new (el: HTMLElement, opciones: Record<string, unknown>) => MapaGoogle }
interface BibliotecaMarcadores { AdvancedMarkerElement: new (opciones: Record<string, unknown>) => MarcadorGoogle }

interface GoogleMapsApi {
  importLibrary(nombre: 'maps'): Promise<BibliotecaMapas>
  importLibrary(nombre: 'marker'): Promise<BibliotecaMarcadores>
}

declare global {
  interface Window { google?: { maps?: GoogleMapsApi } }
}

export interface Mapas { Map: BibliotecaMapas['Map']; Marcador: BibliotecaMarcadores['AdvancedMarkerElement'] }

let carga: Promise<void> | null = null

function cargarScript(clave: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  if (!carga) {
    carga = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(clave)}&v=weekly&loading=async&language=es&region=PE`
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        script.remove()
        carga = null // permite reintentar
        reject(new Error('No se pudo cargar Google Maps. Revisa tu conexión.'))
      }
      document.head.appendChild(script)
    })
  }
  return carga
}

export async function cargarMapas(clave: string): Promise<Mapas> {
  await cargarScript(clave)
  const api = window.google?.maps
  if (!api) throw new Error('Google Maps no está disponible.')
  const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([api.importLibrary('maps'), api.importLibrary('marker')])
  return { Map, Marcador: AdvancedMarkerElement }
}

/** La posición de un marcador puede venir como números o como LatLng (con funciones). */
export function aPunto(posicion: MarcadorGoogle['position']): Punto | null {
  if (!posicion) return null
  const n = (v: Numero) => (typeof v === 'function' ? v() : v)
  return { lat: n(posicion.lat), lng: n(posicion.lng) }
}
