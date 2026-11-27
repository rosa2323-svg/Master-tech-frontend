import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../api/client'
import type { SolicitudReembolso } from '../../api/types'
import { claseEstado } from '../../utils/estados'
import { formatoFecha, formatoSoles } from '../../utils/format'

type Accion = { tipo: 'aprobar' | 'rechazar'; solicitud: SolicitudReembolso }

const CLASE_SOLICITUD: Record<string, string> = {
    PENDIENTE: 'bg-warning text-dark',
    APROBADA: 'bg-success',
    RECHAZADA: 'bg-secondary',
}
const TEXTO_SOLICITUD: Record<string, string> = { PENDIENTE: 'Pendiente', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada' }

export default function AdminReembolsos() {
    const [solicitudes, setSolicitudes] = useState<SolicitudReembolso[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [soloPendientes, setSoloPendientes] = useState(true)
    const [accion, setAccion] = useState<Accion | null>(null)
    const [nota, setNota] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [errorModal, setErrorModal] = useState<string | null>(null)

    useEffect(() => { document.title = 'MASTER TECH | Reembolsos' }, [])
    useEffect(() => {
        api.reembolsos().then(setSolicitudes)
            .catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.'))
            .finally(() => setCargando(false))
    }, [])

    const pendientes = useMemo(() => solicitudes.filter(s => s.estado === 'PENDIENTE').length, [solicitudes])
    const visibles = useMemo(
        () => (soloPendientes ? solicitudes.filter(s => s.estado === 'PENDIENTE') : solicitudes),
        [solicitudes, soloPendientes])

    const abrir = (tipo: Accion['tipo'], solicitud: SolicitudReembolso) => {
        setAccion({ tipo, solicitud }); setNota(''); setErrorModal(null)
    }

    const confirmar = () => {
        if (!accion) return
        if (accion.tipo === 'rechazar' && !nota.trim()) {
            setErrorModal('Explica al cliente por qué se rechaza el reembolso.')
            return
        }
        setGuardando(true)
        setErrorModal(null)
        const { tipo, solicitud } = accion
        const llamada = tipo === 'aprobar' ? api.aprobarReembolso(solicitud.id, nota) : api.rechazarReembolso(solicitud.id, nota)
        llamada
            .then(act => {
                setSolicitudes(ss => ss.map(x => (x.id === act.id ? act : x)))
                setAccion(null)
            })
            .catch(e => setErrorModal(e instanceof Error ? e.message : 'No se pudo resolver la solicitud.'))
            .finally(() => setGuardando(false))
    }

    return (
        <>
            <div className="admin-encabezado">
                <div>
                    <h1 className="admin-titulo">Reembolsos</h1>
                    <p className="admin-subtitulo">
                        Solicitudes de los clientes. Al aprobar se devuelve el dinero en Stripe (productos + envío), el stock vuelve al inventario y el pedido queda anulado.
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar solicitudes">
                <button type="button" className={`btn btn-sm ${soloPendientes ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setSoloPendientes(true)}>
                    Pendientes <span className="badge bg-secondary ms-1">{pendientes}</span>
                </button>
                <button type="button" className={`btn btn-sm ${!soloPendientes ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setSoloPendientes(false)}>
                    Todas <span className="badge bg-secondary ms-1">{solicitudes.length}</span>
                </button>
            </div>

            <div className="tabla-envoltorio">
                <table className="tabla-admin">
                    <thead>
                    <tr><th>Pedido</th><th>Cliente</th><th>Motivo</th><th>Monto</th><th>Estado</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                    {visibles.length === 0 ? (
                        <tr><td colSpan={6}><div className="vacio">{cargando ? 'Cargando…' : soloPendientes ? 'No hay solicitudes pendientes.' : 'Aún no hay solicitudes.'}</div></td></tr>
                    ) : visibles.map(s => (
                        <tr key={s.id}>
                            <td>
                                <span className="fw-semibold">{s.numeroOrden}</span>
                                <div className="texto-tenue small">#{s.ventaId} · {formatoFecha(s.fechaSolicitud)}</div>
                                <span className={`badge ${claseEstado(s.estadoVenta)}`}>{s.estadoVenta}</span>
                            </td>
                            <td>{s.usuarioNombre ?? '—'}<div className="texto-tenue small">{s.usuarioEmail}</div></td>
                            <td style={{ maxWidth: 280 }}>
                                {s.motivo}
                                {s.notaAdmin && <div className="texto-tenue small mt-1">Respuesta: {s.notaAdmin}{s.resueltoPorNombre && <> — {s.resueltoPorNombre}</>}</div>}
                            </td>
                            <td className="fw-semibold">{formatoSoles(s.monto)}</td>
                            <td><span className={`badge ${CLASE_SOLICITUD[s.estado] ?? 'bg-secondary'}`}>{TEXTO_SOLICITUD[s.estado] ?? s.estado}</span></td>
                            <td>
                                {s.estado === 'PENDIENTE' ? (
                                    <div className="celda-acciones">
                                        <button type="button" className="btn btn-sm btn-success" onClick={() => abrir('aprobar', s)}>Aprobar</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => abrir('rechazar', s)}>Rechazar</button>
                                    </div>
                                ) : <span className="texto-tenue small">{s.fechaResolucion ? formatoFecha(s.fechaResolucion) : '—'}</span>}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Modal show={accion !== null} onHide={() => !guardando && setAccion(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{accion?.tipo === 'aprobar' ? 'Aprobar reembolso' : 'Rechazar reembolso'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errorModal && <div className="alert alert-danger py-2">{errorModal}</div>}
                    <p className="mb-2">
                        Pedido <strong>{accion?.solicitud.numeroOrden}</strong> de {accion?.solicitud.usuarioNombre ?? 'cliente'}.
                    </p>
                    <p className="small text-muted">Motivo: {accion?.solicitud.motivo}</p>
                    {accion?.tipo === 'aprobar' && (
                        <div className="alert alert-warning py-2 small">
                            Se devolverán <strong>{accion ? formatoSoles(accion.solicitud.monto) : ''}</strong> al cliente en Stripe, el stock volverá al inventario
                            y el pedido quedará anulado. Esta acción no se puede deshacer.
                        </div>
                    )}
                    <label className="form-label small" htmlFor="notaReembolso">
                        {accion?.tipo === 'rechazar' ? 'Motivo del rechazo (el cliente lo verá)' : 'Nota (opcional)'}
                    </label>
                    <textarea id="notaReembolso" className="form-control" rows={2} maxLength={255} value={nota}
                              onChange={e => setNota(e.target.value)} />
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-outline-secondary" disabled={guardando} onClick={() => setAccion(null)}>Cancelar</button>
                    <button type="button" className={`btn px-4 ${accion?.tipo === 'aprobar' ? 'btn-success' : 'btn-danger'}`} disabled={guardando} onClick={confirmar}>
                        {guardando ? 'Procesando…' : accion?.tipo === 'aprobar' ? 'Aprobar y reembolsar' : 'Rechazar'}
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
