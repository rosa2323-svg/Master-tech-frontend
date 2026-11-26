import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../../api/client'
import type { HuecoTarifa, TarifaEnvio } from '../../../api/types'
import { formatoSoles } from '../../../utils/format'
import { Aviso, type AvisoEstado } from './Aviso'

interface FormTarifa {
    nombre: string
    desde: string
    hasta: string
    costo: string
    gratisDesde: string
    diasMin: string
    diasMax: string
}

const VACIO: FormTarifa = { nombre: '', desde: '', hasta: '', costo: '', gratisDesde: '', diasMin: '1', diasMax: '1' }

const aNumero = (texto: string) => (texto.trim() === '' ? NaN : Number(texto.replace(',', '.')))
const km = (n: number) => String(Number(n))

function plazo(t: TarifaEnvio): string {
    const dias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`
    return t.diasEntregaMin === t.diasEntregaMax ? dias(t.diasEntregaMax) : `${t.diasEntregaMin} a ${dias(t.diasEntregaMax)}`
}

export default function TarifasTab() {
    const [tarifas, setTarifas] = useState<TarifaEnvio[]>([])
    const [huecos, setHuecos] = useState<HuecoTarifa[]>([])
    const [cargando, setCargando] = useState(true)
    const [aviso, setAviso] = useState<AvisoEstado | null>(null)
    const [editando, setEditando] = useState<TarifaEnvio | 'nueva' | null>(null)
    const [form, setForm] = useState<FormTarifa>(VACIO)
    const [error, setError] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [cambiando, setCambiando] = useState<number | null>(null)

    const cargar = useCallback(async () => {
        try {
            const [ts, hs] = await Promise.all([api.tarifasEnvio(), api.huecosTarifas()])
            setTarifas(ts)
            setHuecos(hs)
        } catch (e) {
            setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar las tarifas.' })
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { void cargar() }, [cargar])

    const abrir = (t: TarifaEnvio | 'nueva') => {
        setForm(t === 'nueva' ? VACIO : {
            nombre: t.nombre,
            desde: String(t.distanciaDesdeKm),
            hasta: String(t.distanciaHastaKm),
            costo: String(t.costo),
            gratisDesde: t.envioGratisDesde === null ? '' : String(t.envioGratisDesde),
            diasMin: String(t.diasEntregaMin),
            diasMax: String(t.diasEntregaMax),
        })
        setError(null)
        setEditando(t)
    }

    const guardar = async (e: FormEvent) => {
        e.preventDefault()
        const nombre = form.nombre.trim()
        const desde = aNumero(form.desde)
        const hasta = aNumero(form.hasta)
        const costo = aNumero(form.costo)
        const gratis = aNumero(form.gratisDesde)
        const diasMin = aNumero(form.diasMin)
        const diasMax = aNumero(form.diasMax)
        if (!nombre) return setError('Escribe el nombre del tramo (ej. "0 a 5 km").')
        if (!Number.isFinite(desde) || desde < 0) return setError('La distancia mínima debe ser un número desde 0.')
        if (!Number.isFinite(hasta) || hasta <= desde) return setError('La distancia máxima debe ser mayor que la mínima.')
        if (!Number.isFinite(costo) || costo < 0) return setError('El costo debe ser un número desde 0.')
        if (form.gratisDesde.trim() !== '' && (!Number.isFinite(gratis) || gratis < 0)) return setError('El monto para envío gratis debe ser un número desde 0, o déjalo vacío.')
        if (!Number.isInteger(diasMin) || diasMin < 0 || diasMin > 30) return setError('Los días mínimos deben ser un entero entre 0 y 30.')
        if (!Number.isInteger(diasMax) || diasMax < diasMin || diasMax > 30) return setError('Los días máximos deben ser un entero entre los días mínimos y 30.')

        const actual = editando !== null && editando !== 'nueva' ? editando : null
        setGuardando(true)
        try {
            const datos = {
                nombre,
                distanciaDesdeKm: desde,
                distanciaHastaKm: hasta,
                costo,
                envioGratisDesde: form.gratisDesde.trim() === '' ? null : gratis,
                diasEntregaMin: diasMin,
                diasEntregaMax: diasMax,
            }
            if (actual) await api.actualizarTarifaEnvio(actual.id, datos)
            else await api.crearTarifaEnvio(datos)
            await cargar()
            setAviso({ ok: true, texto: actual ? 'Tarifa actualizada.' : 'Tarifa creada.' })
            setEditando(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar.')
        } finally {
            setGuardando(false)
        }
    }

    const alternar = async (t: TarifaEnvio) => {
        setCambiando(t.id)
        try {
            const actualizada = await api.activarTarifaEnvio(t.id, !t.activo)
            await cargar()
            setAviso({ ok: true, texto: `"${actualizada.nombre}" quedó ${actualizada.activo ? 'activo' : 'inactivo'}.` })
        } catch (err) {
            setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo cambiar el estado.' })
        } finally {
            setCambiando(null)
        }
    }

    const hayActivas = tarifas.some(t => t.activo)

    return (
        <>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <p className="texto-tenue mb-0">
                    Cada tramo cubre desde su distancia mínima (incluida) hasta la máxima (excluida). Los tramos activos no pueden superponerse.
                </p>
                <button type="button" className="btn btn-mastertech px-4" onClick={() => abrir('nueva')}>
                    <i className="bi bi-plus-lg me-1" />Nueva tarifa
                </button>
            </div>

            <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
            {!cargando && !hayActivas && (
                <div className="alert alert-warning" role="alert">No hay tarifas activas: ningún pedido a domicilio tendrá cobertura.</div>
            )}
            {!cargando && hayActivas && huecos.length > 0 && (
                <div className="alert alert-warning" role="alert">
                    Estas distancias no tienen tarifa activa y aparecerían como "sin cobertura":{' '}
                    <strong>{huecos.map(h => `${km(h.desdeKm)} a ${km(h.hastaKm)} km`).join(', ')}</strong>.
                </div>
            )}

            <div className="tabla-envoltorio">
                <table className="tabla-admin">
                    <thead>
                    <tr><th>Tramo</th><th>Distancia</th><th>Costo</th><th>Gratis desde</th><th>Plazo (días hábiles)</th><th>Estado</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                    {tarifas.length === 0 ? (
                        <tr><td colSpan={7}><div className="vacio"><i className="bi bi-cash-coin" />{cargando ? 'Cargando…' : 'Aún no hay tarifas. Crea el primer tramo con "Nueva tarifa".'}</div></td></tr>
                    ) : tarifas.map(t => (
                        <tr key={t.id}>
                            <td className="fw-semibold">{t.nombre}</td>
                            <td>{km(t.distanciaDesdeKm)} a {km(t.distanciaHastaKm)} km</td>
                            <td>{formatoSoles(t.costo)}</td>
                            <td className="texto-tenue">{t.envioGratisDesde === null ? '—' : formatoSoles(t.envioGratisDesde)}</td>
                            <td>{plazo(t)}</td>
                            <td><span className={`badge ${t.activo ? 'bg-success' : 'bg-secondary'}`}>{t.activo ? 'Activo' : 'Inactivo'}</span></td>
                            <td className="celda-acciones">
                                <button type="button" className="btn-accion btn-editar" onClick={() => abrir(t)}><i className="bi bi-pencil-fill" /> Editar</button>
                                <button type="button" className={`btn-accion ${t.activo ? 'btn-borrar' : 'btn-editar'}`} disabled={cambiando === t.id} onClick={() => alternar(t)}>
                                    <i className={`bi ${t.activo ? 'bi-slash-circle' : 'bi-check-circle'}`} /> {t.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <Modal show={editando !== null} onHide={() => !guardando && setEditando(null)} centered>
                <form onSubmit={guardar} noValidate>
                    <Modal.Header closeButton><Modal.Title>{editando === 'nueva' ? 'Nueva tarifa' : 'Editar tarifa'}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        <div className="mb-3">
                            <label className="form-label" htmlFor="tNombre">Nombre del tramo</label>
                            <input id="tNombre" className="form-control" placeholder="Ej. 0 a 5 km" maxLength={100}
                                   value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                        </div>
                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <label className="form-label" htmlFor="tDesde">Desde (km)</label>
                                <input id="tDesde" className="form-control" inputMode="decimal" value={form.desde}
                                       onChange={e => setForm(f => ({ ...f, desde: e.target.value }))} />
                            </div>
                            <div className="col-6">
                                <label className="form-label" htmlFor="tHasta">Hasta (km)</label>
                                <input id="tHasta" className="form-control" inputMode="decimal" value={form.hasta}
                                       onChange={e => setForm(f => ({ ...f, hasta: e.target.value }))} />
                            </div>
                        </div>
                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <label className="form-label" htmlFor="tCosto">Costo de envío (S/)</label>
                                <input id="tCosto" className="form-control" inputMode="decimal" value={form.costo}
                                       onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} />
                            </div>
                            <div className="col-6">
                                <label className="form-label" htmlFor="tGratis">Gratis desde (S/)</label>
                                <input id="tGratis" className="form-control" inputMode="decimal" placeholder="Vacío = nunca gratis" value={form.gratisDesde}
                                       onChange={e => setForm(f => ({ ...f, gratisDesde: e.target.value }))} />
                            </div>
                        </div>
                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label" htmlFor="tDiasMin">Plazo mínimo (días hábiles)</label>
                                <input id="tDiasMin" className="form-control" type="number" min={0} max={30} value={form.diasMin}
                                       onChange={e => setForm(f => ({ ...f, diasMin: e.target.value }))} />
                            </div>
                            <div className="col-6">
                                <label className="form-label" htmlFor="tDiasMax">Plazo máximo (días hábiles)</label>
                                <input id="tDiasMax" className="form-control" type="number" min={0} max={30} value={form.diasMax}
                                       onChange={e => setForm(f => ({ ...f, diasMax: e.target.value }))} />
                            </div>
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
