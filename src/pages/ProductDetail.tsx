import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { Producto } from '../api/types'
import { useAlert } from '../context/AlertContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { rutaCategoria } from '../utils/categorias'
import { formatoSoles, imagenProducto, IMG_DEFECTO, marcaDe, STOCK_BAJO } from '../utils/format'

const DESCUENTO = 15
const CALIFICACION = 4.5

function Estrellas({ valor }: { valor: number }) {
  const llenas = Math.floor(valor)
  return (
    <>
      {Array.from({ length: llenas }, (_, i) => <i key={i} className="bi bi-star-fill text-warning me-1" />)}
      {valor - llenas >= 0.5 && <i className="bi bi-star-half text-warning" />}
    </>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { productos, categorias } = useCatalog()
  const { agregar } = useCart()
  const { mostrarAlerta } = useAlert()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'noEncontrado'>('cargando')
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    let vivo = true
    setEstado('cargando')
    setCantidad(1)
    api.producto(id ?? '')
      .then(p => { if (vivo) { setProducto(p); setEstado('ok') } })
      .catch(e => {
        if (!vivo) return
        if (e instanceof ApiError && e.status !== 404) mostrarAlerta(e.message)
        setEstado('noEncontrado')
      })
    return () => { vivo = false }
  }, [id, mostrarAlerta])

  useEffect(() => { if (producto) document.title = `Master Tech | ${producto.nombre}` }, [producto])

  if (estado === 'cargando') return <div className="container py-5 text-center text-muted">Cargando…</div>
  if (estado === 'noEncontrado' || !producto) {
    return (
      <div className="container py-5 text-center">
        <h4 className="fw-bold">Producto no encontrado</h4>
        <Link to="/" className="boton-carrito d-inline-block mt-3">Volver al inicio</Link>
      </div>
    )
  }

  const hayStock = producto.stock > 0
  const precioReferencia = producto.precio / (1 - DESCUENTO / 100)
  const categoria = categorias.find(c => c.id === producto.categoriaId)
  const relacionados = productos.filter(p => p.categoriaId === producto.categoriaId && p.id !== producto.id).slice(0, 4)

  const mover = (d: number) => setCantidad(c => Math.min(producto.stock, Math.max(1, c + d)))

  const onAgregar = () => {
    const r = agregar(producto, cantidad)
    if (r.ok) mostrarAlerta(`"${producto.nombre}" agregado al carrito.`, true)
    else mostrarAlerta(r.mensaje ?? 'No se pudo agregar el producto.')
  }

  return (
    <div className="container py-5">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Inicio</Link></li>
          {categoria && <li className="breadcrumb-item"><Link to={rutaCategoria(categoria)}>{categoria.nombre}</Link></li>}
          <li className="breadcrumb-item active">{producto.nombre}</li>
        </ol>
      </nav>

      <div className="row g-5 bg-white rounded-4 p-4 shadow-sm mb-4">
        <div className="col-md-5 d-flex align-items-center justify-content-center">
          <img src={imagenProducto(producto.imagenUrl)} alt={producto.nombre} className="imagen-principal"
               onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_DEFECTO }} />
        </div>

        <div className="col-md-7">
          <span className="etiqueta-marca mb-3 d-inline-block">{marcaDe(producto)}</span>
          {producto.codigo && <span className="text-muted small ms-3">Código: {producto.codigo}</span>}
          <h1 className="fw-bold mb-2 titulo-producto">{producto.nombre}</h1>
          <div className="mb-3">
            <Estrellas valor={CALIFICACION} />
            <span className="text-muted small ms-2">({CALIFICACION} / 5)</span>
          </div>
          <hr />
          <div className="mb-3">
            <span className="precio-principal">{formatoSoles(producto.precio)}</span>
            <span className="ms-2 text-muted text-decoration-line-through small">{formatoSoles(precioReferencia)}</span>
            <span className="badge bg-danger ms-2">-{DESCUENTO}%</span>
          </div>

          <div className="mb-4">
            {producto.stock > STOCK_BAJO
              ? <span className="etiqueta-stock bg-success text-white"><i className="bi bi-check-circle me-1" /> En stock</span>
              : hayStock
                ? <span className="etiqueta-stock bg-warning text-dark">¡Solo {producto.stock} disponibles!</span>
                : <span className="etiqueta-stock bg-secondary text-white">Agotado</span>}
          </div>

          {hayStock && (
            <div className="mb-4">
              <p className="fw-semibold mb-2">Cantidad:</p>
              <div className="control-cantidad">
                <button type="button" aria-label="Disminuir cantidad" onClick={() => mover(-1)}><i className="bi bi-dash" /></button>
                <input type="number" value={cantidad} min={1} max={producto.stock}
                       onChange={e => setCantidad(Math.min(producto.stock, Math.max(1, parseInt(e.target.value) || 1)))} />
                <button type="button" aria-label="Aumentar cantidad" onClick={() => mover(1)}><i className="bi bi-plus" /></button>
              </div>
            </div>
          )}

          <div className="d-flex gap-3 flex-wrap mb-4">
            <button type="button" className="boton-agregar" disabled={!hayStock} onClick={onAgregar}>
              <i className="bi bi-cart-plus me-2" />{hayStock ? 'Agregar al carrito' : 'Agotado'}
            </button>
            <Link to="/carrito" className="boton-carrito"><i className="bi bi-cart3 me-2" />Ver carrito</Link>
          </div>

          <div className="row g-3">
            {[['bi-truck', 'Envío gratis', 'A todo el Perú'],
              ['bi-shield-check', 'Garantía', '12 meses oficial'],
              ['bi-arrow-counterclockwise', 'Devolución', '30 días']].map(([icono, titulo, texto]) => (
              <div className="col-4" key={titulo}>
                <div className="tarjeta-beneficio">
                  <i className={`bi ${icono} d-block mb-1`} />
                  <p className="small fw-semibold mb-0">{titulo}</p>
                  <p className="small text-muted mb-0">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {producto.descripcion && (
        <div className="bg-white rounded-4 p-4 shadow-sm mb-4">
          <h5 className="fw-bold mb-1 pb-2 titulo-seccion d-inline-block">Descripción del producto</h5>
          <p className="text-muted mt-3 mb-0">{producto.descripcion}</p>
        </div>
      )}

      {relacionados.length > 0 && (
        <section className="mt-5">
          <h4 className="fw-bold mb-4">Productos relacionados</h4>
          <div className="row g-4">
            {relacionados.map(p => (
              <div className="col-6 col-md-3" key={p.id}>
                <Link to={`/producto/${p.id}`} className="text-decoration-none text-dark">
                  <div className="producto-relacionado bg-white rounded-4 p-3 shadow-sm h-100">
                    <img src={imagenProducto(p.imagenUrl)} alt={p.nombre}
                         onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_DEFECTO }} />
                    <p className="fw-semibold small mt-3 mb-1">{p.nombre}</p>
                    <p className="fw-bold mb-0">{formatoSoles(p.precio)}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
