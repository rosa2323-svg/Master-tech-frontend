import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../api/client'
import type { Categoria } from '../../api/types'
import { useCatalog } from '../../context/CatalogContext'

export default function AdminCategorias() {
  const { categorias, productos, recargar, cargando } = useCatalog()
  const [editando, setEditando] = useState<Categoria | 'nueva' | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [imagen, setImagen] = useState<File | null>(null)
  const [quitarImagen, setQuitarImagen] = useState(false)
  const [porEliminar, setPorEliminar] = useState<Categoria | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => { document.title = 'MASTER TECH | Admin de categorías' }, [])

  // Vista previa de la imagen elegida (se libera al cambiarla o cerrar el modal)
  const vistaPrevia = useMemo(() => (imagen ? URL.createObjectURL(imagen) : null), [imagen])
  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia) }, [vistaPrevia])

  const cuenta = (id: number) => productos.filter(p => p.categoriaId === id).length

  const abrir = (c: Categoria | 'nueva') => {
    setForm(c === 'nueva' ? { nombre: '', descripcion: '' } : { nombre: c.nombre, descripcion: c.descripcion ?? '' })
    setImagen(null); setQuitarImagen(false)
    setError(null); setEditando(c)
  }

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    const nombre = form.nombre.trim()
    if (!nombre) return setError('Escribe el nombre de la categoría.')
    if (categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase() && (editando === 'nueva' || c.id !== (editando as Categoria).id)))
      return setError('Ya existe una categoría con ese nombre.')
    setGuardando(true)
    try {
      const datos = { nombre, descripcion: form.descripcion.trim() }
      const guardada = editando === 'nueva'
        ? await api.crearCategoria(datos)
        : await api.actualizarCategoria((editando as Categoria).id, datos)
      let texto = editando === 'nueva' ? 'Categoría creada.' : 'Categoría actualizada.'
      let ok = true
      try {
        if (imagen) await api.subirImagenCategoria(guardada.id, imagen)
        else if (quitarImagen && editando !== 'nueva' && (editando as Categoria).imagenUrl) await api.quitarImagenCategoria(guardada.id)
      } catch (err) {
        ok = false
        texto += ` Pero la imagen no se pudo actualizar: ${err instanceof Error ? err.message : 'error'}.`
      }
      await recargar()
      setAviso({ ok, texto })
      setEditando(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!porEliminar) return
    try {
      await api.eliminarCategoria(porEliminar.id)
      await recargar()
      setAviso({ ok: true, texto: `Se eliminó "${porEliminar.nombre}".` })
    } catch (err) {
      setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo eliminar.' })
    } finally {
      setPorEliminar(null)
    }
  }

  return (
    <div className="admin-principal-angosto mx-auto">
      <div className="admin-encabezado">
        <div>
          <h1 className="admin-titulo">Gestión de categorías</h1>
          <p className="admin-subtitulo">Solo se pueden eliminar categorías que no tengan productos.</p>
        </div>
        <button type="button" className="btn btn-mastertech px-4" onClick={() => abrir('nueva')}><i className="bi bi-plus-lg me-1" />Nueva categoría</button>
      </div>

      {aviso && (
        <div className={`alert ${aviso.ok ? 'alert-success' : 'alert-danger'} d-flex justify-content-between`} role="alert">
          <span>{aviso.texto}</span>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setAviso(null)} />
        </div>
      )}

      <div className="tabla-envoltorio">
        <table className="tabla-admin">
          <thead><tr><th>#</th><th>Imagen</th><th>Nombre</th><th>Descripción</th><th>Productos</th><th>Acciones</th></tr></thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr><td colSpan={6}><div className="vacio"><i className="bi bi-tags" />{cargando ? 'Cargando…' : 'Aún no hay categorías. Crea la primera con "Nueva categoría".'}</div></td></tr>
            ) : categorias.map(c => {
              const n = cuenta(c.id)
              return (
                <tr key={c.id}>
                  <td className="texto-tenue">{c.id}</td>
                  <td>{c.imagenUrl
                    ? <img src={c.imagenUrl} alt={c.nombre} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                    : <span className="texto-tenue">—</span>}</td>
                  <td className="fw-semibold">{c.nombre}</td>
                  <td className="texto-tenue">{c.descripcion || '—'}</td>
                  <td>{n === 0
                    ? <span className="etiqueta-conteo conteo-vacia">Vacía</span>
                    : <span className="etiqueta-conteo conteo-con">{n} producto{n === 1 ? '' : 's'}</span>}</td>
                  <td className="celda-acciones">
                    <button type="button" className="btn-accion btn-editar" onClick={() => abrir(c)}><i className="bi bi-pencil-fill" /> Editar</button>
                    {n === 0
                      ? <button type="button" className="btn-accion btn-borrar" onClick={() => setPorEliminar(c)}><i className="bi bi-trash-fill" /> Eliminar</button>
                      : <span className="btn-accion btn-bloqueado" title="Tiene productos asociados"><i className="bi bi-lock-fill" /> Bloqueado</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal show={editando !== null} onHide={() => !guardando && setEditando(null)} centered>
        <form onSubmit={guardar} noValidate>
          <Modal.Header closeButton><Modal.Title>{editando === 'nueva' ? 'Nueva categoría' : 'Editar categoría'}</Modal.Title></Modal.Header>
          <Modal.Body>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="mb-3">
              <label className="form-label" htmlFor="cNombre">Nombre</label>
              <input id="cNombre" className="form-control" placeholder="Ej. Laptops" maxLength={100} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="cDescripcion">Descripción</label>
              <textarea id="cDescripcion" className="form-control" rows={3} maxLength={255} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div>
              <label className="form-label" htmlFor="cImagen">Imagen</label>
              {(() => {
                const actual = editando !== null && editando !== 'nueva' && !quitarImagen ? editando.imagenUrl : null
                const mostrar = vistaPrevia ?? actual
                return mostrar
                  ? <div className="mb-2"><img src={mostrar} alt="Imagen de la categoría" style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} /></div>
                  : null
              })()}
              <input id="cImagen" type="file" accept="image/jpeg,image/png,image/webp" className="form-control"
                onChange={e => { setImagen(e.target.files?.[0] ?? null); if (e.target.files?.[0]) setQuitarImagen(false) }} />
              <div className="form-text">
                {editando === 'nueva' ? 'Opcional (JPG, PNG o WEBP, máx. 5 MB).' : 'Déjalo vacío para conservar la imagen actual (máx. 5 MB).'}
              </div>
              {editando !== null && editando !== 'nueva' && editando.imagenUrl && !imagen && (
                <div className="form-check mt-2">
                  <input id="cQuitar" type="checkbox" className="form-check-input" checked={quitarImagen} onChange={e => setQuitarImagen(e.target.checked)} />
                  <label className="form-check-label" htmlFor="cQuitar">Quitar la imagen actual</label>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" disabled={guardando} onClick={() => setEditando(null)}>Cancelar</button>
            <button type="submit" className="btn btn-mastertech px-4" disabled={guardando}><i className="bi bi-check-lg me-1" />{guardando ? 'Guardando…' : 'Guardar'}</button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal show={porEliminar !== null} onHide={() => setPorEliminar(null)} centered size="sm">
        <Modal.Header closeButton><Modal.Title>Eliminar categoría</Modal.Title></Modal.Header>
        <Modal.Body>Vas a eliminar <strong>{porEliminar?.nombre}</strong>. Esta acción no se puede deshacer.</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setPorEliminar(null)}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={eliminar}>Eliminar</button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
