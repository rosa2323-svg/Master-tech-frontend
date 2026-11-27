import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../../api/client'
import type { Feriado } from '../../../api/types'
import { Aviso, type AvisoEstado } from './Aviso'

interface FormConfig {
    horaCorte: string
    diasPreparacion: string
    zonaHoraria: string
}

const CONFIG_VACIA: FormConfig = { horaCorte: '12:00', diasPreparacion: '0', zonaHoraria: 'America/Lima' }

/** "2027-02-01" → "lunes, 01 de febrero de 2027" sin pasar por zonas horarias. */
function fechaLarga(fecha: string): string {
    const [a, m, d] = fecha.split('-').map(Number)
    const f = new Date(a, m - 1, d)
    return isNaN(f.getTime())
        ? fecha
        : f.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

export default function CalendarioTab() {
    const [config, setConfig] = useState<FormConfig>(CONFIG_VACIA)
    const [feriados, setFeriados] = useState<Feriado[]>([])
    const [cargando, setCargando] = useState(true)
    const [aviso, setAviso] = useState<AvisoEstado | null>(null)
    const [guardandoConfig, setGuardandoConfig] = useState(false)
    const [nuevo, setNuevo] = useState({ fecha: '', descripcion: '' })
    const [agregando, setAgregando] = useState(false)
    const [eliminando, setEliminando] = useState<string | null>(null)

    const cargar = useCallback(async () => {
        try {
            const [c, fs] = await Promise.all([api.configEnvio(), api.feriados()])
            setConfig({ horaCorte: c.horaCorte.slice(0, 5), diasPreparacion: String(c.diasPreparacion), zonaHoraria: c.zonaHoraria })
            setFeriados(fs)
        } catch (e) {
            setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cargar la configuración.' })
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => { void cargar() }, [cargar])

    const guardarConfig = async (e: FormEvent) => {
        e.preventDefault()
        const dias = Number(config.diasPreparacion)
        if (!/^\d{2}:\d{2}$/.test(config.horaCorte)) return setAviso({ ok: false, texto: 'Indica la hora de corte.' })
        if (!Number.isInteger(dias) || dias < 0 || dias > 30) return setAviso({ ok: false, texto: 'Los días de preparación deben ser un entero entre 0 y 30.' })
        if (!config.zonaHoraria.trim()) return setAviso({ ok: false, texto: 'Indica la zona horaria.' })
        setGuardandoConfig(true)
        try {
            await api.guardarConfigEnvio({ horaCorte: config.horaCorte, diasPreparacion: dias, zonaHoraria: config.zonaHoraria.trim() })
            setAviso({ ok: true, texto: 'Configuración guardada.' })
        } catch (err) {
            setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo guardar.' })
        } finally {
            setGuardandoConfig(false)
        }
    }

    const agregar = async (e: FormEvent) => {
        e.preventDefault()
        const descripcion = nuevo.descripcion.trim()
        if (!nuevo.fecha) return setAviso({ ok: false, texto: 'Elige la fecha del feriado.' })
        if (!descripcion) return setAviso({ ok: false, texto: 'Escribe una descripción para el feriado.' })
        setAgregando(true)
        try {
            await api.crearFeriado({ fecha: nuevo.fecha, descripcion })
            setNuevo({ fecha: '', descripcion: '' })
            setFeriados(await api.feriados())
            setAviso({ ok: true, texto: 'Feriado agregado.' })
        } catch (err) {
            setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo agregar.' })
        } finally {
            setAgregando(false)
        }
    }

    const eliminar = async (f: Feriado) => {
        if (!window.confirm(`¿Quitar el feriado "${f.descripcion}" (${f.fecha})? Ese día volverá a contar como hábil.`)) return
        setEliminando(f.fecha)
        try {
            await api.eliminarFeriado(f.fecha)
            setFeriados(fs => fs.filter(x => x.fecha !== f.fecha))
            setAviso({ ok: true, texto: 'Feriado eliminado.' })
        } catch (err) {
            setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo eliminar.' })
        } finally {
            setEliminando(null)
        }
    }

    return (
        <>
            <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />

            <section className="mb-4">
                <h2 className="h5 fw-bold">Hora de corte y preparación</h2>
                <p className="texto-tenue">
                    Un pago hecho antes de la hora de corte en día hábil cuenta desde ese mismo día; después, desde el siguiente día hábil.
                    Son hábiles de lunes a sábado, salvo los feriados de abajo.
                </p>
                <form onSubmit={guardarConfig} noValidate className="row g-3 align-items-end">
                    <div className="col-sm-4 col-lg-3">
                        <label className="form-label" htmlFor="cfgHora">Hora de corte</label>
                        <input id="cfgHora" type="time" className="form-control" value={config.horaCorte} disabled={cargando}
                               onChange={e => setConfig(c => ({ ...c, horaCorte: e.target.value }))} />
                    </div>
                    <div className="col-sm-4 col-lg-3">
                        <label className="form-label" htmlFor="cfgDias">Días de preparación</label>
                        <input id="cfgDias" type="number" min={0} max={30} className="form-control" value={config.diasPreparacion} disabled={cargando}
                               onChange={e => setConfig(c => ({ ...c, diasPreparacion: e.target.value }))} />
                    </div>
                    <div className="col-sm-4 col-lg-3">
                        <label className="form-label" htmlFor="cfgZona">Zona horaria</label>
                        <input id="cfgZona" className="form-control" maxLength={50} value={config.zonaHoraria} disabled={cargando}
                               onChange={e => setConfig(c => ({ ...c, zonaHoraria: e.target.value }))} />
                    </div>
                    <div className="col-lg-3">
                        <button type="submit" className="btn btn-mastertech px-4" disabled={cargando || guardandoConfig}>
                            <i className="bi bi-check-lg me-1" />{guardandoConfig ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </section>

            <section>
                <h2 className="h5 fw-bold">Feriados y días no laborables</h2>
                <form onSubmit={agregar} noValidate className="row g-2 align-items-end mb-3">
                    <div className="col-sm-4 col-lg-3">
                        <label className="form-label" htmlFor="ferFecha">Fecha</label>
                        <input id="ferFecha" type="date" className="form-control" value={nuevo.fecha}
                               onChange={e => setNuevo(n => ({ ...n, fecha: e.target.value }))} />
                    </div>
                    <div className="col-sm-5 col-lg-5">
                        <label className="form-label" htmlFor="ferDesc">Descripción</label>
                        <input id="ferDesc" className="form-control" maxLength={100} placeholder="Ej. Navidad" value={nuevo.descripcion}
                               onChange={e => setNuevo(n => ({ ...n, descripcion: e.target.value }))} />
                    </div>
                    <div className="col-sm-3 col-lg-2">
                        <button type="submit" className="btn btn-mastertech w-100" disabled={agregando}>
                            <i className="bi bi-plus-lg me-1" />{agregando ? 'Agregando…' : 'Agregar'}
                        </button>
                    </div>
                </form>

                <div className="tabla-envoltorio">
                    <table className="tabla-admin">
                        <thead><tr><th>Fecha</th><th>Descripción</th><th>Acciones</th></tr></thead>
                        <tbody>
                        {feriados.length === 0 ? (
                            <tr><td colSpan={3}><div className="vacio"><i className="bi bi-calendar-event" />{cargando ? 'Cargando…' : 'No hay feriados registrados.'}</div></td></tr>
                        ) : feriados.map(f => (
                            <tr key={f.fecha}>
                                <td className="fw-semibold text-capitalize">{fechaLarga(f.fecha)}</td>
                                <td>{f.descripcion}</td>
                                <td className="celda-acciones">
                                    <button type="button" className="btn-accion btn-borrar" disabled={eliminando === f.fecha} onClick={() => eliminar(f)}>
                                        <i className="bi bi-trash-fill" /> Quitar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    )
}
