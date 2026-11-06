import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from 'react-bootstrap'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import PasswordInput from './PasswordInput'

const REGEX_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export default function LoginModal() {
  const { loginAbierto, cerrarLogin, login } = useAuth()
  const { mostrarAlerta } = useAlert()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recuperar, setRecuperar] = useState(false)

  const cerrar = () => { cerrarLogin(); setRecuperar(false) }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return mostrarAlerta('Por favor, ingresa tu correo y contraseña.')
    if (!REGEX_CORREO.test(email)) return mostrarAlerta('El formato del correo electrónico no es válido.')
    setEnviando(true)
    try {
      const s = await login(email.trim(), password)
      setPassword('')
      cerrar()
      if (s.rol === 'ADMIN') navigate('/admin/productos')
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal show={loginAbierto} onHide={cerrar} centered contentClassName="border-0 shadow-lg rounded-4 overflow-hidden">
      <div className="row g-0">
        <div className="col-md-5 d-none d-md-block">
          <img src="https://fgxhqbwqjypgxwwafgam.supabase.co/storage/v1/object/public/Baners/Loginmaster.jpeg" alt="Master Tech Login"
               style={{ width: '120%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="col-md-7 bg-dark text-white">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold text-danger">
              <i className={`bi ${recuperar ? 'bi-key' : 'bi-person-circle'} me-2`} />
              {recuperar ? 'Recuperar contraseña' : 'Iniciar Sesión'}
            </h5>
            <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={cerrar} />
          </div>
          <div className="modal-body p-4">
            {recuperar ? (
              <>
                <p className="text-secondary small">
                  Por ahora la recuperación de contraseña se gestiona con nuestro equipo.
                  Escríbenos a <a href="mailto:soporte@mastertech.pe" className="text-danger">soporte@mastertech.pe</a> desde
                  el correo con el que te registraste y te ayudamos a recuperar el acceso.
                </p>
                <button type="button" className="btn btn-outline-danger w-100 fw-bold rounded-pill"
                        onClick={() => setRecuperar(false)}>VOLVER</button>
              </>
            ) : (
              <>
                <form onSubmit={enviar} noValidate>
                  <div className="mb-3">
                    <label className="form-label small text-secondary" htmlFor="loginCorreo">Correo electrónico</label>
                    <input id="loginCorreo" type="email" value={email} onChange={e => setEmail(e.target.value)}
                           className="form-control bg-black text-white border-secondary rounded-3"
                           placeholder="ejemplo@correo.com" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-secondary" htmlFor="loginPassword">Contraseña</label>
                    <PasswordInput id="loginPassword" value={password} onChange={e => setPassword(e.target.value)}
                                   placeholder="••••••••" required />
                  </div>
                  <div className="d-flex justify-content-end align-items-center mb-3">
                    <a href="#recuperar" className="small text-danger text-decoration-none"
                       onClick={e => { e.preventDefault(); setRecuperar(true) }}>¿Olvidaste tu contraseña?</a>
                  </div>
                  <button type="submit" disabled={enviando} className="btn btn-danger w-100 fw-bold rounded-pill py-2">
                    {enviando ? 'INGRESANDO…' : 'INGRESAR'}
                  </button>
                </form>
                <hr className="border-secondary" />
                <p className="text-center small text-secondary mb-0">¿No tienes cuenta?</p>
                <Link to="/registro" onClick={cerrar} className="btn btn-outline-danger w-100 fw-bold rounded-pill mt-2">
                  REGÍSTRATE
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
