import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Cotizacion, EntregaInput, Lugar, Sugerencia } from '../api/types'
import { DISTRITOS_LIMA } from '../utils/distritosLima'
import { formatoSoles, textoEntrega } from '../utils/format'

const nuevoToken = () => crypto.randomUUID()

export interface SeleccionEntrega {
  entrega: EntregaInput
  cotizacion: Cotizacion
}

interface Props {
  items: { productoId: number; cantidad: number }[]
  /** null mientras falte la dirección o la zona no tenga cobertura. */
  onCambio: (seleccion: SeleccionEntrega | null) => void
}

/**
 * Dirección de entrega con costo de envío y fecha estimada cotizados por el servidor.
 * Si el servidor tiene la clave de Google: autocompletado (ubicación exacta; la clave nunca llega al navegador).
 * Si no: distrito de Lima + dirección escrita (ubicación aproximada).
 */
export default function EntregaPedido({ items, onCambio }: Props) {
  const [google, setGoogle] = useState<boolean | null>(null)
  const [distrito, setDistrito] = useState('')
  const [texto, setTexto] = useState('')
  const [referencia, setReferencia] = useState('')
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [token, setToken] = useState(nuevoToken)
  const [errorMapa, setErrorMapa] = useState<string | null>(null)
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clave = JSON.stringify(items)
  const zona = DISTRITOS_LIMA.find(d => d.nombre === distrito)
  const latitud = google ? lugar?.latitud : zona?.latitud
  const longitud = google ? lugar?.longitud : zona?.longitud

  // ¿El servidor tiene autocompletado? Si no, se usa el selector de distrito.
  useEffect(() => {
    api.direccionesDisponible().then(d => setGoogle(d.disponible)).catch(() => setGoogle(false))
  }, [])

  // Sugerencias mientras se escribe (con pausa para no gastar cuota en cada tecla)
  useEffect(() => {
    if (!google || lugar || texto.trim().length < 3) { setSugerencias([]); return }
    let vigente = true
    const espera = setTimeout(() => {
      api.sugerirDirecciones(texto.trim(), token)
        .then(s => { if (vigente) { setSugerencias(s); setErrorMapa(null) } })
        .catch(e => { if (vigente) setErrorMapa(e instanceof Error ? e.message : 'Error al buscar direcciones.') })
    }, 300)
    return () => { vigente = false; clearTimeout(espera) }
  }, [texto, lugar, token, google])

  // Cotización del servidor
  useEffect(() => {
    setCotizacion(null)
    setError(null)
    if (latitud === undefined || longitud === undefined) return
    let vigente = true
    setCargando(true)
    api.cotizarEnvio(JSON.parse(clave) as Props['items'], latitud, longitud)
      .then(c => { if (vigente) setCotizacion(c) })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo calcular el envío.') })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [latitud, longitud, clave])

  // Aviso al carrito
  useEffect(() => {
    const base = google ? lugar?.direccion : (texto.trim() && zona ? `${texto.trim()}, ${zona.nombre}` : '')
    if (cotizacion?.cubierto && base && latitud !== undefined && longitud !== undefined) {
      const ref = referencia.trim()
      onCambio({ entrega: { direccion: (ref ? `${base} (${ref})` : base).slice(0, 255), latitud, longitud }, cotizacion })
    } else {
      onCambio(null)
    }
  }, [cotizacion, lugar, texto, zona, referencia, latitud, longitud, google, onCambio])

  const elegir = async (s: Sugerencia) => {
    setSugerencias([])
    setTexto(s.texto)
    try {
      const d = await api.detalleDireccion(s.placeId, token)
      setLugar(d)
      setTexto(d.direccion)
      setToken(nuevoToken())
      setErrorMapa(null)
    } catch (e) {
      setErrorMapa(e instanceof Error ? e.message : 'No se pudo obtener la ubicación.')
    }
  }

  return (
    <div className="mb-3">
      <h6 className="fw-bold mb-3"><i className="bi bi-geo-alt-fill me-1" />Entrega a domicilio</h6>

      {google === null ? (
        <div className="small text-muted mb-2">Cargando…</div>
      ) : google ? (
        <div className="position-relative mb-2">
          <label className="form-label small mb-1" htmlFor="entDireccion">Dirección</label>
          <input id="entDireccion" className="form-control" maxLength={200} autoComplete="off"
                 placeholder="Escribe tu dirección y elige una sugerencia" value={texto}
                 onChange={e => { setTexto(e.target.value); setLugar(null) }} />
          {sugerencias.length > 0 && (
            <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 5 }}>
              {sugerencias.map(s => (
                <li key={s.placeId} className="list-group-item list-group-item-action small" role="button" tabIndex={0}
                    onClick={() => void elegir(s)} onKeyDown={e => { if (e.key === 'Enter') void elegir(s) }}>
                  {s.texto}
                </li>
              ))}
            </ul>
          )}
          {texto.trim().length >= 3 && !lugar && sugerencias.length === 0 && !errorMapa && (
            <div className="small text-muted mt-1">Elige una de las sugerencias para confirmar la ubicación.</div>
          )}
          {errorMapa && <div className="small text-danger mt-1">{errorMapa}</div>}
        </div>
      ) : (
        <>
          <label className="form-label small mb-1" htmlFor="entDistrito">Distrito</label>
          <select id="entDistrito" className="form-select mb-2" value={distrito} onChange={e => setDistrito(e.target.value)}>
            <option value="">Elige tu distrito…</option>
            {DISTRITOS_LIMA.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
          </select>
          <label className="form-label small mb-1" htmlFor="entDireccion">Dirección</label>
          <input id="entDireccion" className="form-control mb-2" maxLength={200} placeholder="Av. / calle y número"
                 value={texto} onChange={e => setTexto(e.target.value)} />
        </>
      )}

      <label className="form-label small mb-1" htmlFor="entReferencia">Piso, departamento o referencia (opcional)</label>
      <input id="entReferencia" className="form-control" maxLength={50} value={referencia} onChange={e => setReferencia(e.target.value)} />

      <div className="small mt-2" aria-live="polite">
        {cargando && <span className="text-muted">Calculando envío…</span>}
        {error && <span className="text-danger">{error}</span>}
        {cotizacion && !cotizacion.cubierto && (
          <span className="text-danger"><i className="bi bi-exclamation-circle me-1" />{cotizacion.mensaje}</span>
        )}
        {cotizacion?.cubierto && cotizacion.entregaDesde && cotizacion.entregaHasta && (
          <span className="text-muted">
            <i className="bi bi-truck me-1" />Llega {textoEntrega(cotizacion.entregaDesde, cotizacion.entregaHasta)}
            {cotizacion.envioGratis && <strong className="text-success ms-1">· Envío gratis</strong>}
          </span>
        )}
      </div>
      {cotizacion?.cubierto && !cotizacion.envioGratis && cotizacion.costoEnvio !== undefined && (
        <div className="small text-muted">
          Envío {formatoSoles(cotizacion.costoEnvio)}
          {cotizacion.distanciaKm !== undefined && ` · ${cotizacion.distanciaKm} km desde ${cotizacion.sedeNombre ?? 'nuestro almacén'}`}
        </div>
      )}
    </div>
  )
}
