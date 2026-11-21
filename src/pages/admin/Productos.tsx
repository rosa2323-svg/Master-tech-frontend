import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal } from 'react-bootstrap'
import { api } from '../../api/client'
import type { Producto } from '../../api/types'
import SortableTh, { alternarOrden, ordenar, type Orden } from '../../components/SortableTh'
import { useCatalog } from '../../context/CatalogContext'
import { formatoSoles, normalizar, STOCK_BAJO } from '../../utils/format'

type Col = 'codigo' | 'nombre' | 'marca' | 'categoria' | 'precio' | 'stock'
type FiltroEstado = 'activos' | 'inhabilitados' | 'todos'
const VACIO = { nombre: '', marca: '', categoriaId: '', precio: '', stock: '', descripcion: '' }

function InsigniaStock({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="badge bg-secondary">Agotado</span>
  if (stock <= STOCK_BAJO) return <span className="badge bg-warning text-dark">{stock} (bajo)</span>
  return <span className="badge bg-success">{stock}</span>
}

export default function AdminProductos() {
  const { categorias, recargar: recargarTienda } = useCatalog()
  // El panel ve también los inhabilitados; el catálogo público (CatalogContext) solo recibe los habilitados.
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos')
  const [busqueda, setBusqueda] = useState('')
  const [soloBajo, setSoloBajo] = useState(false)
  const [orden, setOrden] = useState<Orden<Col> | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
  const [form, setForm] = useState(VACIO)
  const [imagen, setImagen] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [porInhabilitar, setPorInhabilitar] = useState<Producto | null>(null)

  useEffect(() => { document.title = 'MASTER TECH | Admin de productos' }, [])

  const recargar = useCallback(async () => {
    try {
      setProductos(await api.productos(true))
    } catch (err) {
      setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudieron cargar los productos.' })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void recargar() }, [recargar])

  const nombreCategoria = (id: number) => categorias.find(c => c.id === id)?.nombre ?? '—'

  const visibles = useMemo(() => {
    const t = normalizar(busqueda)
    const filtrados = productos.filter(p =>
      (filtroEstado === 'todos' || (filtroEstado === 'activos') === (p.activo !== false)) &&
      (!t || normalizar(p.nombre).includes(t) || normalizar(p.marca ?? '').includes(t) || normalizar(p.codigo ?? '').includes(t)) &&
      (!soloBajo || p.stock <= STOCK_BAJO))
    return ordenar(filtrados, p => {
      switch (orden?.col) {
        case 'codigo': return p.codigo ?? ''
        case 'nombre': return p.nombre
        case 'marca': return p.marca ?? ''
        case 'categoria': return nombreCategoria(p.categoriaId)
        case 'precio': return p.precio
        case 'stock': return p.stock
        default: return p.id
      }
    }, orden)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, categorias, busqueda, soloBajo, orden, filtroEstado])

  const habilitados = productos.filter(p => p.activo !== false)
  const valorInventario = habilitados.reduce((a, p) => a + p.precio * p.stock, 0)

  const abrirNuevo = () => { setForm(VACIO); setImagen(null); setErrorForm(null); setEditando('nuevo') }
  const abrirEditar = (p: Producto) => {
    setForm({
      nombre: p.nombre, marca: p.marca ?? '', categoriaId: String(p.categoriaId),
      precio: String(p.precio), stock: String(p.stock), descripcion: p.descripcion ?? '',
    })
    setImagen(null); setErrorForm(null); setEditando(p)
  }

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    setErrorForm(null)
    const precio = Number(form.precio), stock = Number(form.stock)
    if (!form.nombre.trim()) return setErrorForm('Escribe el nombre del producto.')
    if (!form.categoriaId) return setErrorForm('Elige una categoría.')
    if (!form.marca.trim()) return setErrorForm('Escribe la marca.')
    if (form.precio === '' || !(precio >= 0)) return setErrorForm('Ingresa un precio igual o mayor a 0.')
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) return setErrorForm('Ingresa un stock entero igual o mayor a 0.')

    const datos = {
      nombre: form.nombre.trim(), marca: form.marca.trim(), categoriaId: Number(form.categoriaId),
      precio, stock, descripcion: form.descripcion.trim(),
    }
    setGuardando(true)
    try {
      const guardado = editando === 'nuevo' || editando === null
        ? await api.crearProducto(datos)
        : await api.actualizarProducto(editando.id, datos)
      let aviso = editando === 'nuevo' ? 'Producto creado.' : 'Producto actualizado.'
      if (imagen) {
        try { await api.subirImagenProducto(guardado.id, imagen) }
        catch (err) { aviso += ` Pero la imagen no se pudo subir: ${err instanceof Error ? err.message : 'error'}.` }
      }
      await recargar()
      void recargarTienda()   // mantiene al día el catálogo público (chatbot, buscador)
      setEditando(null)
      setAviso({ ok: true, texto: aviso })
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarActivo = async (producto: Producto, activo: boolean) => {
    try {
      await api.cambiarActivoProducto(producto.id, activo)
      await recargar()
      void recargarTienda()
      setAviso({ ok: true, texto: activo ? `Se habilitó "${producto.nombre}".` : `Se inhabilitó "${producto.nombre}". Ya no aparece en la tienda.` })
    } catch (err) {
      setAviso({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo cambiar el estado del producto.' })
    } finally {
      setPorInhabilitar(null)
    }
  }

  const th = (col: Col, texto: string) => <SortableTh col={col} orden={orden} onOrden={c => setOrden(o => alternarOrden(o, c))}>{texto}</SortableTh>

  return (
    <>
      <div className="admin-encabezado">
        <div>
          <h1 className="admin-titulo">Gestión de productos</h1>
          <p className="admin-subtitulo">Administra el catálogo, el stock y el valor del inventario.</p>
        </div>
        <button type="button" className="btn btn-mastertech px-4" onClick={abrirNuevo}><i className="bi bi-plus-lg me-1" />Nuevo producto</button>
      </div>

      {aviso && (
        <div className={`alert ${aviso.ok ? 'alert-success' : 'alert-danger'} d-flex justify-content-between`} role="alert">
          <span>{aviso.texto}</span>
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setAviso(null)} />
        </div>
      )}

      <section className="tarjetas-metricas" aria-label="Métricas del inventario">
        <div className="tarjeta-metrica"><div className="metrica-etiqueta">Productos habilitados</div><div className="metrica-valor principal">{habilitados.length}</div></div>
        <div className="tarjeta-metrica"><div className="metrica-etiqueta">Stock bajo ({STOCK_BAJO} o menos)</div><div className="metrica-valor alerta">{habilitados.filter(p => p.stock <= STOCK_BAJO).length}</div></div>
        <div className="tarjeta-metrica"><div className="metrica-etiqueta">Valor del inventario</div><div className="metrica-valor">{formatoSoles(valorInventario)}</div></div>
      </section>

      <div className="barra-herramientas">
        <input type="search" className="form-control" placeholder="Buscar por nombre, marca o código" aria-label="Buscar productos"
               value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="form-select w-auto" aria-label="Filtrar por estado" value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value as FiltroEstado)}>
          <option value="activos">Habilitados</option>
          <option value="inhabilitados">Inhabilitados</option>
          <option value="todos">Todos</option>
        </select>
        <button type="button" className={`btn btn-outline-warning ${soloBajo ? 'active' : ''}`} aria-pressed={soloBajo} onClick={() => setSoloBajo(v => !v)}>
          <i className="bi bi-exclamation-triangle me-1" />Solo stock bajo
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => { setBusqueda(''); setSoloBajo(false); setOrden(null); setFiltroEstado('activos') }}>
          <i className="bi bi-x-lg me-1" />Limpiar
        </button>
      </div>

      <div className="tabla-envoltorio">
        <table className="tabla-admin">
          <thead>
            <tr>{th('codigo', 'Código')}{th('nombre', 'Nombre')}{th('marca', 'Marca')}{th('categoria', 'Categoría')}{th('precio', 'Precio')}{th('stock', 'Inventario')}<th>Acciones</th></tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr><td colSpan={7}><div className="vacio"><i className="bi bi-inbox" />{cargando ? 'Cargando…' : 'No hay productos que coincidan.'}</div></td></tr>
            ) : visibles.map(p => (
              <tr key={p.id} className={p.activo === false ? 'fila-inactiva' : p.stock <= 0 ? 'fila-agotada' : ''}>
                <td className="texto-tenue text-nowrap">{p.codigo ?? `#${p.id}`}</td>
                <td className="fw-semibold">{p.nombre}{p.activo === false && <span className="badge bg-secondary ms-2">Inhabilitado</span>}</td>
                <td>{p.marca}</td>
                <td><span className="etiqueta-categoria">{nombreCategoria(p.categoriaId)}</span></td>
                <td className="precio-admin">{formatoSoles(p.precio)}</td>
                <td className="text-center"><InsigniaStock stock={p.stock} /></td>
                <td className="celda-acciones">
                  <button type="button" className="btn-accion btn-editar" onClick={() => abrirEditar(p)}><i className="bi bi-pencil-fill" /> Editar</button>
                  {p.activo === false
                    ? <button type="button" className="btn-accion btn-habilitar" onClick={() => void cambiarActivo(p, true)}><i className="bi bi-check-circle-fill" /> Habilitar</button>
                    : <button type="button" className="btn-accion btn-borrar" onClick={() => setPorInhabilitar(p)}><i className="bi bi-slash-circle-fill" /> Inhabilitar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={editando !== null} onHide={() => !guardando && setEditando(null)} centered>
        <form onSubmit={guardar} noValidate>
          <Modal.Header closeButton><Modal.Title>{editando === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}</Modal.Title></Modal.Header>
          <Modal.Body>
            {errorForm && <div className="alert alert-danger py-2">{errorForm}</div>}
            {editando !== null && editando !== 'nuevo' && editando.codigo && (
              <div className="mb-3">
                <label className="form-label" htmlFor="pCodigo">Código</label>
                <input id="pCodigo" className="form-control" value={editando.codigo} readOnly disabled />
                <div className="form-text">Lo asigna el sistema y no se puede cambiar.</div>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label" htmlFor="pNombre">Nombre</label>
              <input id="pNombre" className="form-control" placeholder="Ej. Mouse Gamer RGB" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="pCategoria">Categoría</label>
                <select id="pCategoria" className="form-select" value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}>
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="pMarca">Marca</label>
                <input id="pMarca" className="form-control" placeholder="Ej. Logitech" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="pDescripcion">Descripción</label>
              <textarea id="pDescripcion" className="form-control" rows={2} maxLength={255} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="pImagen">Imagen</label>
              <input id="pImagen" type="file" accept="image/*" className="form-control" onChange={e => setImagen(e.target.files?.[0] ?? null)} />
              <div className="form-text">{editando === 'nuevo' ? 'Opcional (máx. 5 MB). El código (p. ej. LAP-0001) se asigna solo al crear, según su categoría.' : 'Déjalo vacío para conservar la imagen actual (máx. 5 MB).'}</div>
            </div>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="pPrecio">Precio (S/)</label>
                <input id="pPrecio" type="number" min="0" step="0.01" className="form-control" placeholder="0.00" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="pStock">Inventario</label>
                <input id="pStock" type="number" min="0" step="1" className="form-control" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" disabled={guardando} onClick={() => setEditando(null)}>Cancelar</button>
            <button type="submit" className="btn btn-mastertech px-4" disabled={guardando}>
              <i className="bi bi-check-lg me-1" />{guardando ? 'Guardando…' : editando === 'nuevo' ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal show={porInhabilitar !== null} onHide={() => setPorInhabilitar(null)} centered size="sm">
        <Modal.Header closeButton><Modal.Title>Inhabilitar producto</Modal.Title></Modal.Header>
        <Modal.Body>
          <strong>{porInhabilitar?.nombre}</strong> dejará de mostrarse y de venderse en la tienda, pero se conserva su historial de ventas.
          Podrás volver a habilitarlo cuando quieras.
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setPorInhabilitar(null)}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={() => porInhabilitar && void cambiarActivo(porInhabilitar, false)}>Inhabilitar</button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
