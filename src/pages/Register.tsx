import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { api } from '../api/client'
import PasswordInput from '../components/PasswordInput'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'

const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
const CAMPO = 'form-control bg-black text-white border-secondary rounded-3'

export default function Register() {
  const { mostrarAlerta } = useAlert()
  const { abrirLogin } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({
    nombre: '', dni: '', direccion: '', email: '', telefono: '', password: '', confirm: '', terminos: false,
  })
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)

  useEffect(() => { document.title = 'Crear cuenta | MASTER TECH' }, [])
  const set = (k: keyof typeof f, v: string | boolean) => setF(p => ({ ...p, [k]: v }))

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const { nombre, dni, direccion, email, telefono, password, confirm, terminos } = f
    if (!nombre || !dni || !direccion || !email || !telefono || !password || !confirm)
      return mostrarAlerta('Por favor, completa todos los campos del formulario.')
    if (!REGEX_CORREO.test(email)) return mostrarAlerta('Por favor, ingresa un correo electrónico válido.')
    if (dni.length !== 8) return mostrarAlerta('El DNI debe tener exactamente 8 dígitos.')
    if (telefono.length !== 9) return mostrarAlerta('El número de teléfono debe tener exactamente 9 dígitos.')
    if (!REGEX_PASSWORD.test(password))
      return mostrarAlerta('La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, un número y un carácter especial.')
    if (password !== confirm) return mostrarAlerta('Las contraseñas no coinciden. Por favor, verifícalas.')
    if (!terminos) return mostrarAlerta('Debes aceptar los Términos y Condiciones para continuar.')

    setEnviando(true)
    try {
      await api.registro({ nombre: nombre.trim(), email: email.trim(), password, dni, direccion, numeroTelefono: telefono })
      setExito(true)
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="d-flex align-items-center py-5" style={{ background: 'radial-gradient(circle, #1a0b3d 0%, #000000 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="row g-0">
                <div className="col-md-5 d-none d-md-block">
                  <img src="https://fgxhqbwqjypgxwwafgam.supabase.co/storage/v1/object/public/Baners/Loginmaster.jpeg" alt="Master Tech" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="col-md-7 bg-dark text-white">
                  <div className="p-4 p-md-5">
                    <h4 className="fw-bold text-danger mb-1"><i className="bi bi-person-plus me-2" />Crear Cuenta</h4>
                    <p className="text-secondary small mb-4">Únete a Master Tech</p>
                    <form onSubmit={enviar} noValidate>
                      <div className="mb-3">
                        <label className="form-label small text-secondary" htmlFor="nombreCompleto">Nombre completo</label>
                        <input id="nombreCompleto" className={CAMPO} placeholder="Ej: Rosa Vivas" maxLength={50} value={f.nombre}
                               onChange={e => set('nombre', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-secondary" htmlFor="dni">DNI</label>
                        <input id="dni" className={CAMPO} placeholder="12345678" inputMode="numeric" maxLength={8} value={f.dni}
                               onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-secondary" htmlFor="direccion">Dirección</label>
                        <input id="direccion" className={CAMPO} placeholder="Av. Arequipa 265, Cercado de Lima" value={f.direccion}
                               onChange={e => set('direccion', e.target.value)} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-secondary" htmlFor="correo">Correo electrónico</label>
                        <input id="correo" type="email" className={CAMPO} placeholder="ejemplo@correo.com" maxLength={100} value={f.email}
                               onChange={e => set('email', e.target.value)} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-secondary" htmlFor="telefono">Número de teléfono</label>
                        <input id="telefono" className={CAMPO} placeholder="999888777" inputMode="numeric" maxLength={9} value={f.telefono}
                               onChange={e => set('telefono', e.target.value.replace(/\D/g, '').slice(0, 9))} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-secondary" htmlFor="password">Contraseña</label>
                        <PasswordInput id="password" placeholder="••••••••" value={f.password} onChange={e => set('password', e.target.value)} />
                      </div>
                      <div className="mb-4">
                        <label className="form-label small text-secondary" htmlFor="confirmPassword">Confirmar contraseña</label>
                        <PasswordInput id="confirmPassword" placeholder="••••••••" value={f.confirm} onChange={e => set('confirm', e.target.value)} />
                      </div>
                      <div className="form-check mb-4">
                        <input className="form-check-input" type="checkbox" id="terminos" checked={f.terminos}
                               onChange={e => set('terminos', e.target.checked)} />
                        <label className="form-check-label small text-secondary" htmlFor="terminos">Acepto los Términos y Condiciones</label>
                        <Link to="/terminos" target="_blank" className="text-danger text-decoration-none small d-block">
                          (Ver Términos y Condiciones)
                        </Link>
                      </div>
                      <button type="submit" disabled={enviando} className="btn btn-danger w-100 fw-bold rounded-pill py-2">
                        {enviando ? 'CREANDO CUENTA…' : 'CREAR CUENTA'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={exito} centered backdrop="static" keyboard={false} contentClassName="bg-dark text-white border-secondary">
        <div className="modal-header bg-danger border-0">
          <h5 className="modal-title fw-bold text-uppercase"><i className="bi bi-check-circle me-2" />¡Cuenta Registrada!</h5>
        </div>
        <div className="modal-body text-center p-4">
          <p className="mb-0">Tu cuenta se creó correctamente. Ya puedes iniciar sesión y comprar.</p>
        </div>
        <div className="modal-footer border-0 justify-content-center">
          <button type="button" className="btn btn-danger fw-bold rounded-pill px-5"
                  onClick={() => { setExito(false); navigate('/'); abrirLogin() }}>INICIAR SESIÓN</button>
        </div>
      </Modal>
    </div>
  )
}
