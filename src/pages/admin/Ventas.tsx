import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import type { Venta } from '../../api/types'
import SortableTh, { alternarOrden, ordenar, type Orden } from '../../components/SortableTh'
import { claseEstado } from '../../utils/estados'
import { formatoFecha, formatoSoles, normalizar } from '../../utils/format'

type Col = 'id' | 'fecha' | 'cliente' | 'numeroOrden' | 'estado' | 'items' | 'total'

export default function AdminVentas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden<Col> | null>({ col: 'fecha', dir: 'desc' })
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set())

  useEffect(() => { document.title = 'MASTER TECH | Reporte de ventas' }, [])
  useEffect(() => {
    api.ventas().then(setVentas)
      .catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar el reporte.'))
      .finally(() => setCargando(false))
  }, [])

  const visibles = useMemo(() => {
    const t = normalizar(busqueda)
    const filtradas = ventas.filter(v => !t
      || String(v.id) === t
      || normalizar(v.numeroOrden).includes(t)
      || normalizar(v.usuarioNombre ?? '').includes(t)
      || normalizar(v.usuarioEmail ?? '').includes(t))
    return ordenar(filtradas, v => {
      switch (orden?.col) {
        case 'fecha': return new Date(v.fecha).getTime()
        case 'cliente': return v.usuarioNombre ?? ''
        case 'numeroOrden': return v.numeroOrden
        case 'estado': return v.estado ?? ''
        case 'items': return v.cantidadItems
        case 'total': return v.total
        default: return v.id
      }
    }, orden)
  }, [ventas, busqueda, orden])

  const alternar = (id: number) => setAbiertas(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const th = (col: Col, texto: string) => <SortableTh col={col} orden={orden} onOrden={c => setOrden(o => alternarOrden(o, c))}>{texto}</SortableTh>

  return (
    <>
      <div className="admin-encabezado">
        <div>
          <h1 className="admin-titulo">Reporte de ventas</h1>
          <p className="admin-subtitulo">Historial de transacciones de Master Tech para la gestión interna.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="barra-herramientas">
        <input type="search" className="form-control" placeholder="Buscar por ID, cliente o N° de orden" aria-label="Buscar ventas"
               value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <button type="button" className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setOrden({ col: 'fecha', dir: 'desc' }) }}>
          <i className="bi bi-x-lg me-1" />Limpiar
        </button>
      </div>

      <div className="tabla-envoltorio">
        <table className="tabla-admin">
          <thead><tr>{th('id', 'ID')}{th('fecha', 'Fecha')}{th('cliente', 'Cliente')}{th('numeroOrden', 'N° Orden')}{th('estado', 'Estado')}{th('items', 'Items')}{th('total', 'Total')}</tr></thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr><td colSpan={7}><div className="vacio"><i className="bi bi-inbox" />{cargando ? 'Cargando…' : 'No hay ventas que coincidan.'}</div></td></tr>
            ) : visibles.map(v => (
              <Fragment key={v.id}>
                <tr style={{ cursor: 'pointer' }} onClick={() => alternar(v.id)} aria-expanded={abiertas.has(v.id)}>
                  <td className="texto-tenue"><i className={`bi ${abiertas.has(v.id) ? 'bi-chevron-down' : 'bi-chevron-right'} me-1`} />{v.id}</td>
                  <td>{formatoFecha(v.fecha)}</td>
                  <td>{v.usuarioNombre ?? '—'}<div className="texto-tenue small">{v.usuarioEmail}</div></td>
                  <td className="fw-semibold">{v.numeroOrden}</td>
                  <td><span className={`badge ${claseEstado(v.estado || 'Pagado')}`}>{v.estado || 'Pagado'}</span></td>
                  <td className="text-center">{v.cantidadItems}</td>
                  <td className="precio-admin">{formatoSoles(v.total)}</td>
                </tr>
                {abiertas.has(v.id) && (
                  <tr className="fila-detalle">
                    <td colSpan={7}>
                      <div className="detalle-contenedor">
                        <div className="detalle-titulo">Productos de la orden {v.numeroOrden}</div>
                        <ul className="detalle-lista">
                          {v.detalles.map(d => (
                            <li className="detalle-item" key={d.id}>
                              <span>{d.productoNombre}</span>
                              <span className="detalle-cant">× {d.cantidad}</span>
                              <span className="detalle-precio">{formatoSoles(d.subtotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
