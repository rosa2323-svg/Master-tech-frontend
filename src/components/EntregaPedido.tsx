import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Cotizacion, EntregaInput } from '../api/types'
import { DISTRITOS_LIMA } from '../utils/distritosLima'
import { formatoSoles, textoEntrega } from '../utils/format'

export interface SeleccionEntrega {
    entrega: EntregaInput
    cotizacion: Cotizacion
}

interface Props {
    items: { productoId: number; cantidad: number }[]
    /** null mientras falte distrito/dirección o la zona no tenga cobertura. */
    onCambio: (seleccion: SeleccionEntrega | null) => void
}

/** Distrito + dirección de entrega, con costo de envío y fecha estimada cotizados por el servidor. */
export default function EntregaPedido({ items, onCambio }: Props) {
    const [distrito, setDistrito] = useState('')
    const [direccion, setDireccion] = useState('')
    const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const clave = JSON.stringify(items)
    const zona = DISTRITOS_LIMA.find(d => d.nombre === distrito)

    useEffect(() => {
        setCotizacion(null)
        setError(null)
        if (!zona) return
        let vigente = true
        setCargando(true)
        api.cotizarEnvio(JSON.parse(clave) as Props['items'], zona.latitud, zona.longitud)
            .then(c => { if (vigente) setCotizacion(c) })
            .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo calcular el envío.') })
            .finally(() => { if (vigente) setCargando(false) })
        return () => { vigente = false }
    }, [zona, clave])

    useEffect(() => {
        if (zona && cotizacion?.cubierto && direccion.trim()) {
            onCambio({
                entrega: { direccion: `${direccion.trim()}, ${zona.nombre}`, latitud: zona.latitud, longitud: zona.longitud },
                cotizacion,
            })
        } else {
            onCambio(null)
        }
    }, [zona, cotizacion, direccion, onCambio])

    return (
        <div className="mb-3">
            <h6 className="fw-bold mb-3"><i className="bi bi-geo-alt-fill me-1" />Entrega a domicilio</h6>
            <label className="form-label small mb-1" htmlFor="entDistrito">Distrito</label>
            <select id="entDistrito" className="form-select mb-2" value={distrito} onChange={e => setDistrito(e.target.value)}>
                <option value="">Elige tu distrito…</option>
                {DISTRITOS_LIMA.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
            </select>
            <label className="form-label small mb-1" htmlFor="entDireccion">Dirección y referencia</label>
            <input id="entDireccion" className="form-control" maxLength={200} placeholder="Av. / calle, número, piso"
                   value={direccion} onChange={e => setDireccion(e.target.value)} />

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
                <div className="small text-muted">Envío {formatoSoles(cotizacion.costoEnvio)}</div>
            )}
        </div>
    )
}
