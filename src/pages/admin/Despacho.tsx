import { Fragment, useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../api/client'
import type { Venta } from '../../api/types'
import HistorialPedido from '../../components/HistorialPedido'
import { ESTADOS_DESPACHO, claseEstado, esAtrasado } from '../../utils/estados'
import { formatoDiaLargo, formatoFecha, formatoSoles, normalizar } from '../../utils/format'

const esRecojo = (p: Venta) => p.tipoEntrega === 'RECOJO'

export default function AdminDespacho() {
    const [pedidos, setPedidos] = useState<Venta[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroTipo, setFiltroTipo] = useState('')
    const [soloAtrasados, setSoloAtrasados] = useState(false)
    const [abiertos, setAbiertos] = useState<Set<number>>(new Set())
    const [aAvanzar, setAAvanzar] = useState<Venta | null>(null)
    const [nota, setNota] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [errorModal, setErrorModal] = useState<string | null>(null)

    useEffect(() => { document.title = 'MASTER TECH | Despacho de pedidos' }, [])
    useEffect(() => {
        api.pedidosDespacho().then(setPedidos)
            .catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los pedidos.'))
            .finally(() => setCargando(false))
    }, [])

    const conteo = useMemo(() => {
        const c: Record<string, number> = {}
        pedidos.forEach(p => { c[p.estado] = (c[p.estado] ?? 0) + 1 })
        return c
    }, [pedidos])

    const atrasados = useMemo(() => pedidos.filter(p => esAtrasado(p.fechaEstimadaEntrega, p.estado)).length, [pedidos])

    const visibles = useMemo(() => {
        const t = normalizar(busqueda)
        return pedidos.filter(p =>
            (!filtroEstado || p.estado === filtroEstado)
            && (!filtroTipo || (p.tipoEntrega ?? 'DOMICILIO') === filtroTipo)
            && (!soloAtrasados || esAtrasado(p.fechaEstimadaEntrega, p.estado))
            && (!t
                || String(p.id) === t
                || normalizar(p.numeroOrden).includes(t)
                || normalizar(p.usuarioNombre ?? '').includes(t)))
    }, [pedidos, busqueda, filtroEstado, filtroTipo, soloAtrasados])

    const alternar = (id: number) => setAbiertos(s => {
        const n = new Set(s)
        if (n.has(id)) n.delete(id); else n.add(id)
        return n
    })

    const abrirCambio = (p: Venta) => { setAAvanzar(p); setNota(''); setErrorModal(null) }

    const confirmarCambio = () => {
        if (!aAvanzar?.siguienteEstado) return
        setGuardando(true)
        setErrorModal(null)
        api.cambiarEstadoPedido(aAvanzar.id, aAvanzar.siguienteEstado, nota)
            .then(act => {
                setPedidos(ps => ps.map(x => (x.id === act.id ? act : x)))
                setAAvanzar(null)
            })
            .catch(e => setErrorModal(e instanceof Error ? e.message : 'No se pudo cambiar el estado.'))
            .finally(() => setGuardando(false))
    }

    const limpiar = () => { setBusqueda(''); setFiltroEstado(''); setFiltroTipo(''); setSoloAtrasados(false) }

    return (
        <>
            <div className="admin-encabezado">
                <div>
                    <h1 className="admin-titulo">Despacho de pedidos</h1>
                    <p className="admin-subtitulo">
                        Prepara, despacha o deja listo para recoger cada pedido. Haz clic en uno para ver la entrega, los productos y su historial.
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filtrar por estado">
                <button type="button" className={`btn btn-sm ${filtroEstado === '' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFiltroEstado('')}>
                    Todos <span className="badge bg-secondary ms-1">{pedidos.length}</span>
                </button>
                {ESTADOS_DESPACHO.map(e => (
                    <button key={e} type="button" className={`btn btn-sm ${filtroEstado === e ? 'btn-dark' : 'btn-outline-dark'}`}
                            onClick={() => setFiltroEstado(filtroEstado === e ? '' : e)}>
                        {e} <span className="badge bg-secondary ms-1">{conteo[e] ?? 0}</span>
                    </button>
                ))}
                <button type="button" className={`btn btn-sm ${soloAtrasados ? 'btn-danger' : 'btn-outline-danger'}`}
                        aria-pressed={soloAtrasados} onClick={() => setSoloAtrasados(v => !v)}>
                    <i className="bi bi-exclamation-triangle me-1" />Atrasados <span className="badge bg-secondary ms-1">{atrasados}</span>
                </button>
            </div>

            <div className="barra-herramientas">
                <input type="search" className="form-control" placeholder="Buscar por ID, cliente o N° de orden" aria-label="Buscar pedidos"
                       value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                <select className="form-select" style={{ maxWidth: 220 }} aria-label="Filtrar por tipo de entrega"
                        value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                    <option value="">Domicilio y recojo</option>
                    <option value="DOMICILIO">Solo a domicilio</option>
                    <option value="RECOJO">Solo recojo en tienda</option>
                </select>
                <button type="button" className="btn btn-outline-secondary" onClick={limpiar}>Limpiar</button>
            </div>

            <div className="tabla-envoltorio">
                <table className="tabla-admin">
                    <thead>
                    <tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Estado</th><th>Items</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                    {visibles.length === 0 ? (
                        <tr><td colSpan={6}><div className="vacio">{cargando ? 'Cargando…' : 'No hay pedidos que coincidan.'}</div></td></tr>
                    ) : visibles.map(p => {
                        const atrasado = esAtrasado(p.fechaEstimadaEntrega, p.estado)
                        return (
                            <Fragment key={p.id}>
                                <tr style={{ cursor: 'pointer' }} onClick={() => alternar(p.id)} aria-expanded={abiertos.has(p.id)}>
                                    <td>
                                        <span className="fw-semibold">{p.numeroOrden}</span>
                                        <div className="texto-tenue small">#{p.id} · {formatoFecha(p.fecha)}</div>
                                    </td>
                                    <td>{p.usuarioNombre ?? '—'}<div className="texto-tenue small">{p.usuarioEmail}</div></td>
                                    <td>
                                        <span className={`badge ${esRecojo(p) ? 'bg-dark' : 'bg-secondary'}`}>
                                            <i className={`bi ${esRecojo(p) ? 'bi-shop' : 'bi-truck'} me-1`} />{esRecojo(p) ? 'Recojo' : 'Domicilio'}
                                        </span>
                                        {p.fechaEstimadaEntrega && (
                                            <div className={`small ${atrasado ? 'text-danger fw-semibold' : 'texto-tenue'}`}>
                                                {atrasado && <i className="bi bi-exclamation-triangle-fill me-1" />}
                                                {esRecojo(p) ? 'Listo' : 'Llega'} {formatoDiaLargo(p.fechaEstimadaEntrega)}
                                            </div>
                                        )}
                                    </td>
                                    <td><span className={`badge ${claseEstado(p.estado)}`}>{p.estado}</span></td>
                                    <td className="text-center">{p.cantidadItems}</td>
                                    <td>
                                        {p.siguienteEstado ? (
                                            <button type="button" className="btn btn-sm btn-primary"
                                                    onClick={e => { e.stopPropagation(); abrirCambio(p) }}>
                                                Pasar a {p.siguienteEstado}
                                            </button>
                                        ) : <span className="texto-tenue">Completado</span>}
                                    </td>
                                </tr>
                                {abiertos.has(p.id) && (
                                    <tr className="fila-detalle">
                                        <td colSpan={6}>
                                            <div className="detalle-contenedor">
                                                <div className="detalle-titulo">{esRecojo(p) ? 'Recojo en tienda' : 'Datos de entrega'}</div>
                                                <ul className="detalle-lista">
                                                    {esRecojo(p) ? (
                                                        <li className="detalle-item">
                                                            <span>Sede</span>
                                                            <span>{p.puntoRepartoNombre ?? '—'}{p.direccionEntrega && <> · {p.direccionEntrega}</>}</span>
                                                        </li>
                                                    ) : (
                                                        <li className="detalle-item">
                                                            <span>Dirección</span>
                                                            <span>
                                                                {p.direccionEntrega || p.usuarioDireccion || 'Sin dirección registrada'}
                                                                {p.latitudEntrega != null && p.longitudEntrega != null && (
                                                                    <> · <a href={`https://www.google.com/maps?q=${p.latitudEntrega},${p.longitudEntrega}`}
                                                                            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                                                                        Ver en el mapa</a></>
                                                                )}
                                                            </span>
                                                        </li>
                                                    )}
                                                    {!esRecojo(p) && p.puntoRepartoNombre && (
                                                        <li className="detalle-item">
                                                            <span>Sale de</span>
                                                            <span>{p.puntoRepartoNombre}{p.distanciaKm != null && <> · {p.distanciaKm} km</>}</span>
                                                        </li>
                                                    )}
                                                    <li className="detalle-item">
                                                        <span>Teléfono</span>
                                                        <span>{p.usuarioTelefono || 'Sin teléfono registrado'}</span>
                                                    </li>
                                                    <li className="detalle-item">
                                                        <span>Envío cobrado</span>
                                                        <span>{p.costoEnvio ? formatoSoles(p.costoEnvio) : 'Gratis'}</span>
                                                    </li>
                                                </ul>
                                                <div className="detalle-titulo">Productos de la orden {p.numeroOrden}</div>
                                                <ul className="detalle-lista">
                                                    {p.detalles.map(d => (
                                                        <li className="detalle-item" key={d.id}>
                                                            <span>{d.productoNombre}</span>
                                                            <span className="detalle-cant">× {d.cantidad}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="detalle-titulo">Historial</div>
                                                <HistorialPedido pedidoId={p.id} modo="despacho" version={p.estado} />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        )
                    })}
                    </tbody>
                </table>
            </div>

            <Modal show={aAvanzar !== null} onHide={() => !guardando && setAAvanzar(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Pasar a {aAvanzar?.siguienteEstado}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {errorModal && <div className="alert alert-danger py-2">{errorModal}</div>}
                    <p className="mb-2">
                        Pedido <strong>{aAvanzar?.numeroOrden}</strong>: de <span className={`badge ${claseEstado(aAvanzar?.estado ?? '')}`}>{aAvanzar?.estado}</span>{' '}
                        a <span className={`badge ${claseEstado(aAvanzar?.siguienteEstado ?? '')}`}>{aAvanzar?.siguienteEstado}</span>.
                    </p>
                    {aAvanzar?.siguienteEstado === 'Entregado' && (
                        <div className="alert alert-warning py-2 small">Al marcarlo como entregado ya no se podrá cambiar.</div>
                    )}
                    <label className="form-label small" htmlFor="notaDespacho">Nota (opcional)</label>
                    <textarea id="notaDespacho" className="form-control" rows={2} maxLength={255} value={nota}
                              placeholder="Ej. Entregado en recepción" onChange={e => setNota(e.target.value)} />
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-outline-secondary" disabled={guardando} onClick={() => setAAvanzar(null)}>Cancelar</button>
                    <button type="button" className="btn btn-primary px-4" disabled={guardando} onClick={confirmarCambio}>
                        {guardando ? 'Guardando…' : 'Confirmar'}
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    )
}
