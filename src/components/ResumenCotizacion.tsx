import type { Cotizacion } from '../api/types'
import { formatoSoles, textoEntrega } from '../utils/format'

interface Props {
  cargando: boolean
  error: string | null
  cotizacion: Cotizacion | null
}

/** Costo y fecha de la cotización (a domicilio o para recoger). */
export default function ResumenCotizacion({ cargando, error, cotizacion }: Props) {
  const recojo = cotizacion?.tipoEntrega === 'RECOJO'
  return (
    <>
      <div className="small mt-2" aria-live="polite">
        {cargando && <span className="text-muted">Calculando…</span>}
        {error && <span className="text-danger">{error}</span>}
        {cotizacion && !cotizacion.cubierto && (
          <span className="text-danger"><i className="bi bi-exclamation-circle me-1" />{cotizacion.mensaje}</span>
        )}
        {cotizacion?.cubierto && cotizacion.entregaDesde && cotizacion.entregaHasta && (
          <span className="text-muted">
            <i className={`bi ${recojo ? 'bi-shop' : 'bi-truck'} me-1`} />
            {recojo ? 'Listo para recoger' : 'Llega'} {textoEntrega(cotizacion.entregaDesde, cotizacion.entregaHasta)}
            {cotizacion.envioGratis && <strong className="text-success ms-1">· {recojo ? 'Gratis' : 'Envío gratis'}</strong>}
          </span>
        )}
      </div>
      {cotizacion?.cubierto && !recojo && !cotizacion.envioGratis && cotizacion.costoEnvio !== undefined && (
        <div className="small text-muted">
          Envío {formatoSoles(cotizacion.costoEnvio)}
          {cotizacion.distanciaKm !== undefined && ` · ${cotizacion.distanciaKm} km desde ${cotizacion.sedeNombre ?? 'nuestro almacén'}`}
        </div>
      )}
    </>
  )
}
