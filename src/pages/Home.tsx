import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Carousel, Modal } from 'react-bootstrap'
import ProductGrid from '../components/ProductGrid'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { categoriaPorPalabra, rutaCategoria } from '../utils/categorias'
import { imagenProducto, IMG_DEFECTO } from '../utils/format'

const SUPABASE = 'https://fgxhqbwqjypgxwwafgam.supabase.co/storage/v1/object/public'
const BANNERS = ['Baner1.jpeg', 'Baner2.jpeg', 'Baner3.jpg'].map(n => `${SUPABASE}/Baners/${n}`)

interface Pack {
  clave: string
  icono: string
  titulo: string
  cabecera: string
  imagen: string
  puntos: string[]
  antes: string
  ahora: string
  etiqueta: string
  palabras: string[]
}

const PACKS: Pack[] = [
  {
    clave: 'laptop', icono: 'bi-laptop', titulo: 'Pack Laptop Pro', cabecera: 'Laptop', imagen: '/Imagenes/laptoppromo.jpeg',
    puntos: ['Laptop Lenovo LOQ Essential AMD Ryzen 7 16GB RAM 512GB', 'Mouse + mochila de regalo', 'Garantía Oficial 12 meses'],
    antes: 'S/ 4,499', ahora: 'S/ 3,899', etiqueta: 'AHORRA S/ 550', palabras: ['laptop', 'computadora'],
  },
  {
    clave: 'telefono', icono: 'bi-phone', titulo: 'Pack Teléfono + Tablet', cabecera: 'Teléfonos y Tablets', imagen: '/Imagenes/telefonopromo.jpg',
    puntos: ['Smartphone gama media/alta (Android o iOS)', 'Tablet compatible, ideal para trabajo o estudio', 'Garantía Oficial 12 meses'],
    antes: 'S/ 2,199', ahora: 'S/ 1,799', etiqueta: 'AHORRA S/ 400', palabras: ['telefono', 'celular'],
  },
  {
    clave: 'consola', icono: 'bi-controller', titulo: 'Consola Sony PlayStation 5 Slim Blanco 4K 825 GB Digital', cabecera: 'Consola', imagen: '/Imagenes/ps5.jpg',
    puntos: ['Edición digital, sin lector de discos', 'Resolución 4K y 825 GB de almacenamiento SSD', 'Color blanco, modelo Slim'],
    antes: 'S/ 2,669', ahora: 'S/ 2,199', etiqueta: 'APROVECHA', palabras: ['consola'],
  },
]

const BENEFICIOS = [
  { icono: 'bi-truck', titulo: 'Envío Gratis', texto: 'A todo el Perú' },
  { icono: 'bi-shield-check', titulo: 'Garantía Oficial', texto: '12 meses' },
  { icono: 'bi-credit-card', titulo: 'Hasta 12 Cuotas', texto: 'Sin intereses' },
  { icono: 'bi-headset', titulo: 'Soporte Técnico 24/7', texto: 'Atención especializada' },
]

export default function Home() {
  const { productos, categorias, cargando, error } = useCatalog()
  const { loginAbierto } = useAuth()
  const navigate = useNavigate()
  const [promoPendiente, setPromoPendiente] = useState(false)
  const [promoVisible, setPromoVisible] = useState(false)

  useEffect(() => { document.title = 'MASTER TECH | Tienda Tecnológica' }, [])

  // Promoción emergente: aparece a los 3 s y espera si hay otro modal abierto.
  useEffect(() => {
    const t = setTimeout(() => setPromoPendiente(true), 3000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (promoPendiente && !loginAbierto) { setPromoVisible(true); setPromoPendiente(false) }
  }, [promoPendiente, loginAbierto])

  const irAPack = (p: Pack) => {
    const cat = categoriaPorPalabra(categorias, ...p.palabras)
    navigate(cat ? rutaCategoria(cat) : '/')
  }

  return (
    <>
      <Carousel interval={5000}>
        {BANNERS.map((src, i) => (
          <Carousel.Item key={src}>
            <img src={src} className="d-block w-100" alt={`Banner ${i + 1}`} />
          </Carousel.Item>
        ))}
      </Carousel>

      <section className="py-5 border-bottom border-top">
        <div className="container">
          <h6 className="text-center fw-bold mb-5 text-uppercase" style={{ letterSpacing: '2px' }}>Nuestras Categorías</h6>
          <div className="row text-center justify-content-center g-4">
            {categorias.map(c => {
              const imagen = c.imagenUrl || productos.find(p => p.categoriaId === c.id && p.imagenUrl)?.imagenUrl
              return (
                  <div className="col-6 col-sm-4 col-md-2" key={c.id}>
                    <Link to={rutaCategoria(c)} className="text-decoration-none text-dark d-flex flex-column align-items-center gap-3">
                      <img src={imagen ? imagenProducto(imagen) : IMG_DEFECTO} alt={c.nombre}
                           className="img-fluid" style={{ height: '120px', objectFit: 'contain' }}
                           onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_DEFECTO }} />
                      <span className="fw-bold text-uppercase" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>{c.nombre}</span>
                    </Link>
                  </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="container my-5">
        <h6 className="text-center fw-bold mb-5 text-uppercase" style={{ letterSpacing: '2px' }}>Productos Disponibles</h6>
        {cargando ? (
          <p className="text-center text-muted">Cargando productos…</p>
        ) : error ? (
          <div className="alert alert-danger text-center">{error}</div>
        ) : (
          <ProductGrid productos={productos} />
        )}
      </div>

      <section className="py-5 text-white text-center" style={{ background: 'radial-gradient(circle, #1a0b3d 0%, #000000 100%)' }}>
        <div className="container py-3">
          <h1 className="display-4 fw-bold mb-3" style={{ letterSpacing: '3px' }}>NUESTRAS PROMOCIONES DISPONIBLES</h1>
          <span className="badge bg-danger text-uppercase fw-bold mb-3 px-3 py-2" style={{ letterSpacing: '2px' }}>Ver Más</span>
        </div>
      </section>

      <section className="container my-5 py-3">
        <div className="row g-4 justify-content-center">
          {PACKS.map(p => (
            <div className="col-md-6 col-lg-4" key={p.clave}>
              <div className="card product-card h-100 bg-dark text-white border-secondary shadow-lg">
                <div className="card-header bg-danger text-white text-uppercase fw-bold text-center py-3" style={{ letterSpacing: '2px' }}>
                  <i className={`bi ${p.icono} me-2`} />{p.cabecera}
                </div>
                <div className="card-body d-flex flex-column p-4">
                  <div className="text-center mb-4">
                    <img src={p.imagen} alt={p.titulo} className="img-fluid rounded-3 img-promo" />
                  </div>
                  <h5 className="card-title fw-bold text-center mb-4">{p.titulo}</h5>
                  <ul className="list-unstyled mb-4">
                    {p.puntos.map(t => (
                      <li className="d-flex align-items-center mb-3" key={t}>
                        <i className="bi bi-check-circle-fill text-danger me-3 fs-5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto text-center">
                    <p className="text-secondary text-decoration-line-through mb-1">{p.antes}</p>
                    <p className="fs-3 fw-bold text-danger mb-3">{p.ahora}</p>
                    <button className="btn btn-danger w-100 fw-bold py-2 text-uppercase" style={{ letterSpacing: '1px' }}
                            onClick={() => irAPack(p)}>
                      <i className="bi bi-eye me-2" />Ver productos
                    </button>
                  </div>
                </div>
                <div className="card-footer bg-dark border-secondary text-center py-2">
                  <span className="badge bg-warning text-dark fw-bold px-3">{p.etiqueta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-5 bg-dark text-white border-top border-secondary">
        <div className="container">
          <div className="row text-center g-4">
            {BENEFICIOS.map(b => (
              <div className="col-6 col-md-3" key={b.titulo}>
                <i className={`bi ${b.icono} fs-2 text-danger mb-2 d-block`} />
                <p className="fw-bold mb-0 small text-uppercase">{b.titulo}</p>
                <p className="text-secondary small mb-0">{b.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal show={promoVisible} onHide={() => setPromoVisible(false)} centered contentClassName="border-0 shadow-lg rounded-4">
        <div className="d-flex justify-content-end p-3">
          <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setPromoVisible(false)} />
        </div>
        <div className="modal-body text-center p-4 pt-0">
          <p className="text-secondary small text-uppercase fw-semibold mb-3" style={{ letterSpacing: '1px' }}>
            ¡Nuevo Lanzamiento en Master Tech!
          </p>
          <div className="d-flex justify-content-center mb-4">
            <img src="/Imagenes/iPhone256.jpg" className="img-fluid rounded-3 shadow-sm" style={{ maxHeight: '400px' }} alt="Promo" />
          </div>
          <p className="fs-5 px-3 mb-4" style={{ fontWeight: 400, lineHeight: 1.4 }}>
            iPhone 17 Pro max ya está disponible. <br /><strong>¡No te quedes sin el tuyo!</strong>
          </p>
          <Link to="/buscar?query=iphone" onClick={() => setPromoVisible(false)}
                className="btn btn-danger rounded-pill px-5 py-2 fw-bold shadow-sm">Llévame allí</Link>
        </div>
      </Modal>
    </>
  )
}
