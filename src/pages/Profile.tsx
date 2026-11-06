import { useEffect, useState, type FormEvent } from 'react'
import { Accordion, Modal, Tab, Tabs } from 'react-bootstrap'
import { api } from '../api/client'
import type { Perfil, Venta } from '../api/types'
import PasswordInput from '../components/PasswordInput'
import { useAlert } from '../context/AlertContext'
import { formatoFecha, formatoSoles } from '../utils/format'

const CLAVE_ICONO = 'mastertech_icono_perfil'
const ICONO_DEFECTO = 'bi-person-circle'
const ICONOS = [
  ['bi-person-circle', 'Persona'], ['bi-emoji-smile-fill', 'Sonrisa'], ['bi-controller', 'Control de juegos'],
  ['bi-joystick', 'Joystick'], ['bi-cpu-fill', 'Procesador'], ['bi-laptop', 'Laptop'], ['bi-phone-fill', 'Teléfono'],
  ['bi-headset', 'Audífonos'], ['bi-rocket-takeoff-fill', 'Cohete'], ['bi-lightning-charge-fill', 'Rayo'],
  ['bi-robot', 'Robot'], ['bi-trophy-fill', 'Trofeo'], ['bi-stars', 'Estrellas'], ['bi-fire', 'Fuego'],
  ['bi-moon-stars-fill', 'Luna'], ['bi-heart-fill', 'Corazón'],
] as const

function iconoGuardado() {
  try {
    const g = localStorage.getItem(CLAVE_ICONO)
    return ICONOS.some(([c]) => c === g) ? (g as string) : ICONO_DEFECTO
  } catch { return ICONO_DEFECTO }
}

export default function Profile() {
  const { mostrarAlerta } = useAlert()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [pedidos, setPedidos] = useState<Venta[]>([])
  const [cargando, setCargando] = useState(true)
  const [icono, setIcono] = useState(iconoGuardado)
  const [modalIconos, setModalIconos] = useState(false)

  const [datos, setDatos] = useState({ nombre: '', direccion: '', telefono: '' })
  const [datosOk, setDatosOk] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [pw, setPw] = useState({ actual: '', nueva: '', confirmar: '' })
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => { document.title = 'Mi perfil | MASTER TECH' }, [])

  useEffect(() => {
    Promise.all([api.miPerfil(), api.misPedidos()])
      .then(([p, v]) => {
        setPerfil(p)
        setPedidos(v)
        setDatos({ nombre: p.nombre ?? '', direccion: p.direccion ?? '', telefono: p.numeroTelefono ?? '' })
      })
      .catch(e => mostrarAlerta(e instanceof Error ? e.message : 'No se pudo cargar tu perfil.'))
      .finally(() => setCargando(false))
  }, [mostrarAlerta])

  const guardarDatos = async (e: FormEvent) => {
    e.preventDefault()
    setDatosOk(false)
    if (datos.nombre.trim().length < 2) return mostrarAlerta('Ingresa tu nombre.')
    if (!datos.direccion.trim()) return mostrarAlerta('Ingresa tu dirección.')
    if (!/^\d{9}$/.test(datos.telefono)) return mostrarAlerta('Ingresa un teléfono de 9 dígitos.')
    setGuardando(true)
    try {
      const p = await api.actualizarPerfil({
        nombre: datos.nombre.trim(), direccion: datos.direccion.trim(),
        numeroTelefono: datos.telefono,
      })
      setPerfil(p)
      setDatosOk(true)
      setTimeout(() => setDatosOk(false), 3500)
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (!pw.actual) return setPwMsg({ ok: false, texto: 'Ingresa tu contraseña actual.' })
    if (pw.nueva.length < 8) return setPwMsg({ ok: false, texto: 'La nueva contraseña debe tener mínimo 8 caracteres.' })
    if (pw.nueva !== pw.confirmar) return setPwMsg({ ok: false, texto: 'Las contraseñas no coinciden.' })
    try {
      await api.cambiarPassword({ passwordActual: pw.actual, passwordNuevo: pw.nueva, passwordConfirm: pw.confirmar })
      setPw({ actual: '', nueva: '', confirmar: '' })
      setPwMsg({ ok: true, texto: 'Contraseña actualizada correctamente.' })
    } catch (err) {
      setPwMsg({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.' })
    }
  }

  const elegirIcono = (c: string) => {
    setIcono(c)
    try { localStorage.setItem(CLAVE_ICONO, c) } catch { /* sin almacenamiento */ }
    setModalIconos(false)
  }

  const miembroDesde = perfil?.fechaRegistro
    ? new Date(perfil.fechaRegistro).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
    : '—'

  if (cargando) return <div className="container py-5 text-center text-muted">Cargando tu perfil…</div>

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4" style={{ letterSpacing: '1px' }}><i className="bi bi-person-circle me-2" />Mi Perfil</h2>

      <div className="rounded-4 shadow-sm text-white p-4 mb-4" style={{ background: 'radial-gradient(circle, #1a0b3d 0%, #000000 100%)' }}>
        <div className="d-flex flex-column flex-md-row align-items-center gap-4">
          <div className="position-relative">
            <div className="rounded-circle bg-light text-dark d-flex align-items-center justify-content-center border border-3 border-danger"
                 style={{ width: 110, height: 110 }}>
              <i className={`bi ${icono}`} style={{ fontSize: '3.5rem' }} />
            </div>
            <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute bottom-0 end-0"
                    aria-label="Cambiar ícono de perfil" title="Cambiar ícono" onClick={() => setModalIconos(true)}>
              <i className="bi bi-pencil-fill" />
            </button>
          </div>
          <div className="text-center text-md-start">
            <h3 className="fw-bold mb-1">{perfil?.nombre ?? 'Usuario Master Tech'}</h3>
            <p className="mb-1 text-white-50"><i className="bi bi-envelope-fill me-2" />{perfil?.email}</p>
            <p className="mb-0 text-white-50"><i className="bi bi-calendar-check-fill me-2" />Miembro desde {miembroDesde}</p>
          </div>
        </div>
      </div>

      <Tabs defaultActiveKey="datos" className="mb-4">
        <Tab eventKey="datos" title={<><i className="bi bi-person-lines-fill me-2" />Datos personales</>}>
          <div className="row"><div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-3"><div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-pencil-square me-2" />Editar datos personales</h5>
              {datosOk && <div className="alert alert-success" role="alert"><i className="bi bi-check-circle-fill me-2" />Datos guardados correctamente.</div>}
              <form onSubmit={guardarDatos} noValidate>
                <div className="mb-3">
                  <label htmlFor="inputNombre" className="form-label">Nombre completo</label>
                  <input id="inputNombre" className="form-control" maxLength={60} placeholder="Ej: Sara Vargas" value={datos.nombre}
                         onChange={e => setDatos(d => ({ ...d, nombre: e.target.value.replace(/[^\p{L} ']/gu, '') }))} />
                </div>
                <div className="mb-3">
                  <label htmlFor="inputDireccion" className="form-label">Dirección de entrega</label>
                  <input id="inputDireccion" className="form-control" placeholder="Ej: Av. Javier Prado 123, Lima" value={datos.direccion}
                         onChange={e => setDatos(d => ({ ...d, direccion: e.target.value }))} />
                </div>
                <div className="mb-4">
                  <label htmlFor="inputTelefono" className="form-label">Teléfono</label>
                  <input id="inputTelefono" type="tel" inputMode="numeric" className="form-control" placeholder="9 dígitos" maxLength={9}
                         value={datos.telefono} onChange={e => setDatos(d => ({ ...d, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) }))} />
                </div>
                <button type="submit" disabled={guardando} className="btn btn-danger w-100 fw-bold">
                  <i className="bi bi-save2-fill me-2" />{guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </form>
            </div></div>
          </div></div>
        </Tab>

        <Tab eventKey="seguridad" title={<><i className="bi bi-shield-lock-fill me-2" />Seguridad</>}>
          <div className="row"><div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-3"><div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-shield-lock-fill me-2" />Cambiar contraseña</h5>
              {pwMsg && <div className={`alert ${pwMsg.ok ? 'alert-success' : 'alert-danger'}`} role="alert">{pwMsg.texto}</div>}
              <form onSubmit={cambiarPassword} noValidate>
                {([['actual', 'Contraseña actual', 'Tu contraseña actual', 'current-password'],
                   ['nueva', 'Nueva contraseña', 'Mínimo 8 caracteres', 'new-password'],
                   ['confirmar', 'Confirmar nueva contraseña', 'Repite la nueva contraseña', 'new-password']] as const).map(([k, etiqueta, ph, ac]) => (
                  <div className="mb-3" key={k}>
                    <label className="form-label" htmlFor={`pw-${k}`}>{etiqueta}</label>
                    <PasswordInput id={`pw-${k}`} placeholder={ph} autoComplete={ac} value={pw[k]}
                                   onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))}
                                   className="bg-white text-dark border-secondary-subtle" />
                  </div>
                ))}
                <button type="submit" className="btn btn-danger w-100 fw-bold mt-2"><i className="bi bi-key-fill me-2" />Cambiar contraseña</button>
              </form>
            </div></div>
          </div></div>
        </Tab>

        <Tab eventKey="historial" title={<><i className="bi bi-bag-check me-2" />Historial de compras</>}>
          {pedidos.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bag-x fs-1 text-muted" />
              <p className="text-muted mt-3 mb-0">Aún no has realizado ninguna compra.</p>
            </div>
          ) : (
            <Accordion className="shadow-sm">
              {pedidos.map(v => (
                <Accordion.Item eventKey={String(v.id)} key={v.id}>
                  <Accordion.Header>
                    <div className="d-flex flex-wrap w-100 justify-content-between pe-3 gap-2">
                      <span className="fw-bold">{v.numeroOrden}</span>
                      <span className="text-muted small">{formatoFecha(v.fecha)}</span>
                      <span className="badge bg-success align-self-center">{v.estado || 'Pagado'}</span>
                      <span className="fw-bold text-danger">{formatoSoles(v.total)}</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <table className="table table-sm mb-0">
                      <thead><tr><th>Producto</th><th className="text-center">Cant.</th><th className="text-end">P. unit.</th><th className="text-end">Subtotal</th></tr></thead>
                      <tbody>
                        {v.detalles.map(d => (
                          <tr key={d.id}>
                            <td>{d.productoNombre}</td>
                            <td className="text-center">{d.cantidad}</td>
                            <td className="text-end">{formatoSoles(d.precioUnitario)}</td>
                            <td className="text-end">{formatoSoles(d.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Tab>
      </Tabs>

      <Modal show={modalIconos} onHide={() => setModalIconos(false)} centered contentClassName="border-0 shadow-lg rounded-4">
        <Modal.Header closeButton><Modal.Title className="fw-bold fs-5">Elige tu ícono de perfil</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-2 text-center">
            {ICONOS.map(([clase, nombre]) => (
              <div className="col-3" key={clase}>
                <button type="button" title={nombre} aria-label={nombre}
                        className={`btn w-100 py-3 ${icono === clase ? 'btn-danger' : 'btn-outline-secondary'}`}
                        onClick={() => elegirIcono(clase)}>
                  <i className={`bi ${clase} fs-3`} />
                </button>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}
