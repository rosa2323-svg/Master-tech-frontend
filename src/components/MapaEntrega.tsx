import { useEffect, useRef, useState } from 'react'
import { aPunto, cargarMapas, type MapaGoogle, type MarcadorGoogle, type Mapas, type Punto } from '../utils/googleMaps'

const LIMA: Punto = { lat: -12.0464, lng: -77.0428 }
const ID_MAPA = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || 'DEMO_MAP_ID'

interface Props {
  clave: string
  /** Pin actual (null = todavía no hay punto elegido). */
  posicion: Punto | null
  /** El cliente hizo clic en el mapa o arrastró el pin. */
  onElegir: (lat: number, lng: number) => void
}

/** Mapa de Google donde el cliente marca el punto exacto de entrega con un pin (clic o arrastrando). */
export default function MapaEntrega({ clave, posicion, onElegir }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaGoogle | null>(null)
  const mapas = useRef<Mapas | null>(null)
  const marcador = useRef<MarcadorGoogle | null>(null)
  const alElegir = useRef(onElegir)
  const posicionInicial = useRef(posicion)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { alElegir.current = onElegir }, [onElegir])

  // Crea el mapa una sola vez
  useEffect(() => {
    let cancelado = false
    cargarMapas(clave)
      .then(m => {
        if (cancelado || !contenedor.current) return
        mapas.current = m
        const inicio = posicionInicial.current
        const mp = new m.Map(contenedor.current, {
          center: inicio ?? LIMA,
          zoom: inicio ? 16 : 11,
          mapId: ID_MAPA,
          mapTypeControl: false,
          streetViewControl: false,
          gestureHandling: 'cooperative',
        })
        mp.addListener('click', e => {
          if (e.latLng) alElegir.current(e.latLng.lat(), e.latLng.lng())
        })
        mapa.current = mp
        setListo(true)
      })
      .catch(e => { if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo cargar el mapa.') })
    return () => {
      cancelado = true
      if (marcador.current) marcador.current.map = null
      marcador.current = null
      mapa.current = null
    }
  }, [clave])

  // Mantiene el pin sincronizado con la ubicación elegida (clic, arrastre o sugerencia del buscador)
  useEffect(() => {
    const mp = mapa.current
    const m = mapas.current
    if (!listo || !mp || !m) return
    if (!posicion) {
      if (marcador.current) marcador.current.map = null
      marcador.current = null
      return
    }
    if (!marcador.current) {
      const pin = new m.Marcador({ map: mp, position: posicion, gmpDraggable: true, title: 'Arrastra el pin para ajustar el punto' })
      pin.addListener('dragend', () => {
        const p = aPunto(pin.position)
        if (p) alElegir.current(p.lat, p.lng)
      })
      marcador.current = pin
    } else {
      marcador.current.position = posicion
    }
    mp.panTo(posicion)
    if ((mp.getZoom() ?? 0) < 15) mp.setZoom(16)
  }, [posicion, listo])

  if (error) return <div className="small text-muted mt-2">{error} Puedes seguir eligiendo tu dirección con el buscador.</div>

  return (
    <div className="mt-2">
      <div ref={contenedor} style={{ height: 260, borderRadius: 8, overflow: 'hidden', background: '#e9ecef' }}
           role="application" aria-label="Mapa para marcar el punto de entrega" />
      <div className="small text-muted mt-1">
        <i className="bi bi-geo-alt-fill me-1" />Haz clic en el mapa o arrastra el pin para marcar el punto exacto de entrega.
      </div>
    </div>
  )
}
