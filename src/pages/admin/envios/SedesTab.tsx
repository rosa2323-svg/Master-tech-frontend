import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../../api/client'
import type { PuntoReparto } from '../../../api/types'
import { Aviso, type AvisoEstado } from './Aviso'

interface FormPunto {
    nombre: string
    direccion: string
    latitud: string
    longitud: string
    permiteRecojo: boolean
}

const VACIO: FormPunto = { nombre: '', direccion: '', latitud: '', longitud: '', permiteRecojo: true }

const aNumero = (texto: string) => (texto.trim() === '' ? NaN : Number(texto.replace(',', '.')))

export default function SedesTab() {
    const [puntos, setPuntos] = useState<PuntoReparto[]>([])
    const [cargando, setCargando] = useState(true)
    const [aviso, setAviso] = useState<AvisoEstado | null>(null)
    const [editando, setEditando] = useState<PuntoReparto | 'nuevo' | null>(null)
    const [form, setForm] = useState<FormPunto>(VACIO)
    const [error, setError] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [cambiando, setCambiando] = useState<number | null>(null)

    const cargar = useCallback(async () => {
        try {
            setPuntos(await api.puntosReparto())
        } catch (e) {
            setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar los almacenes.' })
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { void cargar() }, [cargar])

    const abrir = (p: PuntoReparto | 'nuevo') => {
        setForm(p === 'nuevo' ? VACIO : {
            nombre: p.nombre,
            direccion: p.direccion,
            latitud: String(p.latitud),
            longitud: String(p.longitud),
            permiteRecojo: p.permiteRecojo,
        })
        setError(null)
        setEditando(p)
    }

    const guardar = async (e: FormEvent) => {
        e.preventDefault()
        const nombre = form.nombre.trim()
        const direccion = form.direccion.trim()
        const latitud = aNumero(form.latitud)
        const longitud = aNumero(form.longitud)
        if (!nombre) return setError('Escribe el nombre del almacén.')
        if (!direccion) return setError('Escribe la dirección del almacén.')
        if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90) return setError('La latitud debe ser un número entre -90 y 90.')
        if (!Number.isFinite(longitud) || longitud < -180 || longitud > 180) return setError('La longitud debe ser un número entre -180 y 180.')

        const actual = editando !== null && editando !== 'nuevo' ? editando : null
        setGuardando(true)
        try {
            const datos = { nombre, direccion, latitud, longitud, permiteRecojo: form.permiteRecojo }
            if (actual) await api.actualizarPuntoReparto(actual.id, datos)
            else await api.crearPuntoReparto(datos)
            await cargar()
            setAviso({ ok: true, texto: actual ? 'Almacén actualizado.' : 'Almacén creado.' })
            setEditando(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar.')
        } finally {
            setGuardando(false)
        }
    }

    const alternar = async (p: PuntoReparto) => {
        const unicoActivo = p.activo && puntos.filter(x => x.activo).length === 1
        if (unicoActivo && !window.confirm('Es el único almacén activo: sin almacenes activos no se podrá calcular el envío. ¿Desactivarlo de todos modos?')) return
        setCambiando(p.id)
        try {
            const actualizado = await api.activarPuntoReparto(p.id, !p.activo)
            setPuntos(ps => ps.map(x => (x.id === actualizado.id ? actualizado : x)))
            setAviso({ ok: true, texto: `"${actualizado.nombre}" quedó ${actualizado.activo ? 'activo' : 'inactivo'}.` })
        } catch (err) {
            setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo cambiar el estado.' })
        } finally {
            setCambiando(null)
        }
    }

    const activos = puntos.filter(p => p.activo).length

    return (
        <>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <p className="texto-tenue mb-0">
                    El envío se cobra según la distancia al almacén activo más cercano. Los almacenes no se eliminan: se desactivan.
                </p>
                <button type="button" className="btn btn-mastertech px-4" onClick={() => abrir('nuevo')}>
                    <i className="bi bi-plus-lg me-1" />Nuevo almacén
                </button>
            </div>

            <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
            {!cargando && activos === 0 && (
                <div className="alert alert-warning" role="alert">No hay almacenes activos: no se podrá calcular el costo de envío.</div>
            )}

            <div className="tabla-envoltorio">
                <table className="tabla-admin">
                    <thead>
                    <tr><th>#</th><th>Almacén</th><th>Dirección</th><th>Coordenadas</th><th>Recojo</th><th>Estado</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                    {puntos.length === 0 ? (
                        <tr><td colSpan={7}><div className="vacio"><i className="bi bi-geo-alt" />{cargando ? 'Cargando…' : 'Aún no hay almacenes. Crea el primero con "Nuevo almacén".'}</div></td></tr>
                    ) : puntos.map(p => (
                        <tr key={p.id}>
                            <td className="texto-tenue">{p.id}</td>
                            <td className="fw-semibold">{p.nombre}</td>
                            <td>{p.direccion}</td>
                            <td className="texto-tenue">
                                {Number(p.latitud).toFixed(6)}, {Number(p.longitud).toFixed(6)}{' '}
                                <a href={`https://www.google.com/maps?q=${p.latitud},${p.longitud}`} target="_blank" rel="noopener noreferrer"
                                   title="Ver en Google Maps" aria-label={`Ver ${p.nombre} en Google Maps`}><i className="bi bi-box-arrow-up-right" /></a>
                            </td>
                            <td><span className={`badge ${p.permiteRecojo ? 'bg-info text-dark' : 'bg-secondary'}`}>{p.permiteRecojo ? 'Sí' : 'No'}</span></td>
                            <td><span className={`badge ${p.activo ? 'bg-success' : 'bg-secondary'}`}>{p.activo ? 'Activo' : 'Inactivo'}</span></td>
                            <td className="celda-acciones">
                                <button type="button" className="btn-accion btn-editar" onClick={() => abrir(p)}><i className="bi bi-pencil-fill" /> Editar</button>
                                <button type="button" className={`btn-accion ${p.activo ? 'btn-borrar' : 'btn-editar'}`} disabled={cambiando === p.id} onClick={() => alternar(p)}>
                                    <i className={`bi ${p.activo ? 'bi-slash-circle' : 'bi-check-circle'}`} /> {p.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Modal show={editando !== null} onHide={() => !guardando && setEditando(null)} centered>
                <form onSubmit={guardar} noValidate>
                    <Modal.Header closeButton><Modal.Title>{editando === 'nuevo' ? 'Nuevo almacén' : 'Editar almacén'}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        <div className="mb-3">
                            <label className="form-label" htmlFor="sNombre">Nombre</label>
                            <input id="sNombre" className="form-control" placeholder="Ej. Almacén Norte - Los Olivos" maxLength={100}
                                   value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="sDireccion">Dirección</label>
                            <input id="sDireccion" className="form-control" maxLength={255}
                                   value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
                        </div>
                        <div className="row g-3 mb-1">
                            <div className="col-6">
                                <label className="form-label" htmlFor="sLat">Latitud</label>
                                <input id="sLat" className="form-control" inputMode="decimal" placeholder="-11.980000"
                                       value={form.latitud} onChange={e => setForm(f => ({ ...f, latitud: e.target.value }))} />
                            </div>
                            <div className="col-6">
                                <label className="form-label" htmlFor="sLng">Longitud</label>
                                <input id="sLng" className="form-control" inputMode="decimal" placeholder="-77.070000"
                                       value={form.longitud} onChange={e => setForm(f => ({ ...f, longitud: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-text mb-3">Puedes copiar las coordenadas desde Google Maps: clic derecho sobre el punto y elige el primer valor.</div>
                        <div className="form-check">
                            <input id="sRecojo" type="checkbox" className="form-check-input" checked={form.permiteRecojo}
                                   onChange={e => setForm(f => ({ ...f, permiteRecojo: e.target.checked }))} />
                            <label className="form-check-label" htmlFor="sRecojo">Permite recojo en tienda</label>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <button type="button" className="btn btn-outline-secondary" disabled={guardando} onClick={() => setEditando(null)}>Cancelar</button>
                        <button type="submit" className="btn btn-mastertech px-4" disabled={guardando}><i className="bi bi-check-lg me-1" />{guardando ? 'Guardando…' : 'Guardar'}</button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    )
}
