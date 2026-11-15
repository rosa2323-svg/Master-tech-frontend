import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import type { Venta } from '../../api/types'
import { formatoFecha, normalizar } from '../../utils/format'

const FLUJO = ['Pagado', 'Preparando', 'Despachado', 'Entregado']

const CLASE_ESTADO: Record<string, string> = {
    Pagado: 'bg-primary',
    Preparando: 'bg-warning text-dark',
    Despachado: 'bg-info text-dark',
    Entregado: 'bg-success',
}

function siguienteEstado(estado: string): string | undefined {
    const pos = FLUJO.indexOf(estado)
    return pos >= 0 ? FLUJO[pos + 1] : undefined
}

export default function AdminDespacho() {
    const [pedidos, setPedidos] = useState<Venta[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [abiertos, setAbiertos] = useState<Set<number>>(new Set())
    const [actualizando, setActualizando] = useState<number | null>(null)

    useEffect(() => { document.title = 'MASTER TECH | Despacho de pedidos' }, [])
    useEffect(() => {
        api.pedidosDespacho().then(setPedidos)
            .catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los pedidos.'))
            .finally(() => setCargando(false))
    }, [])

    const visibles = useMemo(() => {
        const t = normalizar(busqueda)
        return pedidos.filter(p =>
            (!filtroEstado || p.estado === filtroEstado)
            && (!t
                || String(p.id) === t
                || normalizar(p.numeroOrden).includes(t)
                || normalizar(p.usuarioNombre ?? '').includes(t)))
    }, [pedidos, busqueda, filtroEstado])

    const alternar = (id: number) => setAbiertos(s => {
        const n = new Set(s)
        if (n.has(id)) n.delete(id); else n.add(id)
        return n
    })

    const avanzar = (p: Venta) => {
        const siguiente = siguienteEstado(p.estado)
        if (!siguiente) return
        if (siguiente === 'Entregado' && !window.confirm(`¿Marcar el pedido ${p.numeroOrden} como entregado? Ya no se podrá cambiar.`)) return
        setError(null)
        setActualizando(p.id)
        api.cambiarEstadoPedido(p.id, siguiente)
            .then(act => setPedidos(ps => ps.map(x => (x.id === act.id ? act : x))))
            .catch(e => setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.'))
            .finally(() => setActualizando(null))
    }

    return (
        <>
            <div className="admin-encabezado">
                <div>
                    <h1 className="admin-titulo">Despacho de pedidos</h1>
                    <p className="admin-subtitulo">
                        Pedidos pagados para preparar, despachar y entregar. Haz clic en un pedido para ver la dirección y los productos.
                    </p>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="barra-herramientas">
                <input type="search" className="form-control" placeholder="Buscar por ID, cliente o N° de orden" aria-label="Buscar pedidos"
                       value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                <select className="form-select" style={{ maxWidth: 220 }} aria-label="Filtrar por estado"
                        value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    {FLUJO.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <button type="button" className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setFiltroEstado('') }}>
                    Limpiar
                </button>
            </div>

            <div className="tabla-envoltorio">
                <table className="tabla-admin">
                    <thead>
                    <tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>N° Orden</th><th>Estado</th><th>Items</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                    {visibles.length === 0 ? (
                        <tr><td colSpan={7}><div className="vacio">{cargando ? 'Cargando…' : 'No hay pedidos que coincidan.'}</div></td></tr>
                    ) : visibles.map(p => {
                        const siguiente = siguienteEstado(p.estado)
                        return (
                            <Fragment key={p.id}>
                                <tr style={{ cursor: 'pointer' }} onClick={() => alternar(p.id)} aria-expanded={abiertos.has(p.id)}>
                                    <td className="texto-tenue">{p.id}</td>
                                    <td>{formatoFecha(p.fecha)}</td>
                                    <td>{p.usuarioNombre ?? '—'}<div className="texto-tenue small">{p.usuarioEmail}</div></td>
                                    <td className="fw-semibold">{p.numeroOrden}</td>
                                    <td><span className={`badge ${CLASE_ESTADO[p.estado] ?? 'bg-secondary'}`}>{p.estado}</span></td>
                                    <td className="text-center">{p.cantidadItems}</td>
                                    <td>
                                        {siguiente ? (
                                            <button type="button" className="btn btn-sm btn-primary" disabled={actualizando === p.id}
                                                    onClick={e => { e.stopPropagation(); avanzar(p) }}>
                                                {actualizando === p.id ? 'Guardando…' : `Pasar a ${siguiente}`}
                                            </button>
                                        ) : <span className="texto-tenue">Completado</span>}
                                    </td>
                                </tr>
                                {abiertos.has(p.id) && (
                                    <tr className="fila-detalle">
                                        <td colSpan={7}>
                                            <div className="detalle-contenedor">
                                                <div className="detalle-titulo">Datos de entrega</div>
                                                <ul className="detalle-lista">
                                                    <li className="detalle-item">
                                                        <span>Dirección</span>
                                                        <span>{p.usuarioDireccion || 'Sin dirección registrada'}</span>
                                                    </li>
                                                    <li className="detalle-item">
                                                        <span>Teléfono</span>
                                                        <span>{p.usuarioTelefono || 'Sin teléfono registrado'}</span>
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
        </>
    )
}