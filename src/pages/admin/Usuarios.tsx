import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../api/client'
import type { Rol, Usuario } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import { formatoFecha, normalizar } from '../../utils/format'

const ETIQUETA_ROL: Record<Rol, string> = { USER: 'Cliente', ADMIN: 'Administrador', DESPACHADOR: 'Despachador' }

export default function AdminUsuarios() {
  const { sesion } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [detalle, setDetalle] = useState<Usuario | null>(null)
  const [porEliminar, setPorEliminar] = useState<Usuario | null>(null)

  useEffect(() => { document.title = 'MASTER TECH | Admin de usuarios' }, [])

  const cargar = () => api.usuarios()
    .then(setUsuarios)
    .catch(e => setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.' }))
    .finally(() => setCargando(false))
  useEffect(() => { void cargar() }, [])

  const visibles = useMemo(() => {
    const t = normalizar(busqueda)
    return usuarios.filter(u =>
      (!t || normalizar(u.nombre).includes(t) || normalizar(u.email).includes(t)) &&
      (!filtroRol || u.rol === filtroRol))
  }, [usuarios, busqueda, filtroRol])

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    try {
      const nuevo = await api.cambiarRol(u.id, rol)
      setUsuarios(lista => lista.map(x => (x.id === u.id ? { ...x, rol: nuevo.rol } : x)))
      setAviso({ ok: true, texto: `Ahora ${u.nombre} es ${ETIQUETA_ROL[rol]}.` })
    } catch (e) {
      setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cambiar el rol.' })
      void cargar()
    }
  }

  const eliminar = async () => {
    if (!porEliminar) return
    try {
      await api.eliminarUsuario(porEliminar.id)
      setUsuarios(l => l.filter(x => x.id !== porEliminar.id))
      setAviso({ ok: true, texto: `Se eliminó a ${porEliminar.nombre}.` })
    } catch (e) {
      setAviso({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar el usuario.' })
    } finally {
      setPorEliminar(null)
    }
  }

  return (
    <>
      <div className="admin-encabezado">
        <div>
          <h1 className="admin-titulo">Gestión de usuarios</h1>
          <p className="admin-subtitulo">Consulta y administra los usuarios de Master Tech.</p>
        </div>
      </div>

      {aviso && (
        <div className={`alert ${aviso.ok ? 'alert-success' : 'alert-danger'} d-flex justify-content-between`} role="alert">
          <span>{aviso.texto}</span>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setAviso(null)} />
        </div>
      )}

      <div className="barra-herramientas">
        <input type="search" className="form-control" placeholder="Buscar por nombre o correo" aria-label="Buscar usuarios"
               value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="form-select w-auto" aria-label="Filtrar por rol" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="DESPACHADOR">Despachador</option>
          <option value="USER">Cliente</option>
        </select>
        <button type="button" className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setFiltroRol('') }}>
          <i className="bi bi-x-lg me-1" />Limpiar
        </button>
      </div>

      <div className="tabla-envoltorio">
        <table className="tabla-admin">
          <thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr><td colSpan={5}><div className="vacio"><i className="bi bi-inbox" />{cargando ? 'Cargando…' : 'No hay usuarios que coincidan.'}</div></td></tr>
            ) : visibles.map(u => {
              const esYo = u.email.toLowerCase() === sesion?.email.toLowerCase()
              return (
                <tr key={u.id}>
                  <td className="texto-tenue">{u.id}</td>
                  <td className="fw-semibold">{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <select className="form-select form-select-sm w-auto" aria-label={`Rol de ${u.nombre}`} value={u.rol}
                            disabled={esYo} title={esYo ? 'No puedes cambiar tu propio rol' : undefined}
                            onChange={e => void cambiarRol(u, e.target.value as Rol)}>
                      <option value="USER">Cliente</option>
                      <option value="DESPACHADOR">Despachador</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </td>
                  <td className="celda-acciones">
                    <button type="button" className="btn-accion btn-editar" onClick={() => setDetalle(u)}><i className="bi bi-eye-fill" /> Ver detalle</button>
                    {esYo
                      ? <span className="btn-accion btn-bloqueado" title="No puedes eliminar tu propia cuenta"><i className="bi bi-lock-fill" /> Tu cuenta</span>
                      : <button type="button" className="btn-accion btn-borrar" onClick={() => setPorEliminar(u)}><i className="bi bi-trash-fill" /> Eliminar</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal show={detalle !== null} onHide={() => setDetalle(null)} centered>
        <Modal.Header closeButton><Modal.Title>Detalle del usuario</Modal.Title></Modal.Header>
        <Modal.Body>
          {detalle && (
            <dl className="row mb-0">
              <dt className="col-4">Nombre</dt><dd className="col-8">{detalle.nombre}</dd>
              <dt className="col-4">Correo</dt><dd className="col-8">{detalle.email}</dd>
              <dt className="col-4">Rol</dt><dd className="col-8">{ETIQUETA_ROL[detalle.rol]}</dd>
              <dt className="col-4">DNI</dt><dd className="col-8">{detalle.dni || '—'}</dd>
              <dt className="col-4">Teléfono</dt><dd className="col-8">{detalle.numeroTelefono || '—'}</dd>
              <dt className="col-4">Dirección</dt><dd className="col-8">{detalle.direccion || '—'}</dd>
              <dt className="col-4">Registro</dt><dd className="col-8">{detalle.fechaRegistro ? formatoFecha(detalle.fechaRegistro) : '—'}</dd>
            </dl>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={porEliminar !== null} onHide={() => setPorEliminar(null)} centered size="sm">
        <Modal.Header closeButton><Modal.Title>Eliminar usuario</Modal.Title></Modal.Header>
        <Modal.Body>Vas a eliminar a <strong>{porEliminar?.nombre}</strong>. Esta acción no se puede deshacer.</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setPorEliminar(null)}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={eliminar}>Eliminar</button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
