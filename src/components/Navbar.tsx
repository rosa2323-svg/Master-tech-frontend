import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Dropdown, Nav, Navbar as BsNavbar } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { rutaCategoria } from '../utils/categorias'
import { normalizar } from '../utils/format'

export default function Navbar() {
  const { categorias, productos } = useCatalog()
  const { cuenta } = useCart()
  const { sesion, esAdmin, abrirLogin, logout } = useAuth()
  const esDespachador = sesion?.rol === 'DESPACHADOR'
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()

  const [expandido, setExpandido] = useState(false)
  const [texto, setTexto] = useState(location.pathname === '/buscar' ? params.get('query') ?? '' : '')
  const [verSugerencias, setVerSugerencias] = useState(false)

  useEffect(() => { setExpandido(false) }, [location.pathname])

  const sugerencias = useMemo(() => {
    const t = normalizar(texto)
    if (t.length < 2) return []
    const nombres = productos
      .filter(p => normalizar(p.nombre).includes(t) || normalizar(p.marca ?? '').includes(t))
      .map(p => ({ tipo: 'producto' as const, id: p.id, etiqueta: p.nombre }))
      .slice(0, 5)
    const cats = categorias
      .filter(c => normalizar(c.nombre).includes(t))
      .map(c => ({ tipo: 'categoria' as const, id: c.id, etiqueta: c.nombre, ruta: rutaCategoria(c) }))
      .slice(0, 2)
    return [...nombres, ...cats]
  }, [texto, productos, categorias])

  const buscar = (t: string) => {
    const q = t.trim()
    if (!q) return
    setVerSugerencias(false)
    navigate(`/buscar?query=${encodeURIComponent(q)}`)
  }

  return (
    <BsNavbar expand="lg" variant="dark" bg="dark" sticky="top" className="shadow-sm py-3"
              expanded={expandido} onToggle={setExpandido}>
      <div className="container">
        <BsNavbar.Brand as={Link} to="/" className="fw-bold fs-3" style={{ letterSpacing: '3px' }}>
          MASTER TECH
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="navbarNav" />

        <BsNavbar.Collapse id="navbarNav">
          <Nav className="mx-auto text-uppercase">
            {categorias.map(c => (
              <Nav.Link key={c.id} as={NavLink} to={rutaCategoria(c)} className="px-4 fs-6">
                {c.nombre}
              </Nav.Link>
            ))}
          </Nav>

          <div className="position-relative me-3">
            <input
              className="form-control me-2 py-2 input-busqueda-mastertech"
              type="search" placeholder="Buscar productos..." autoComplete="off"
              aria-label="Buscar productos" value={texto}
              onChange={e => { setTexto(e.target.value); setVerSugerencias(true) }}
              onFocus={() => setVerSugerencias(true)}
              onBlur={() => setTimeout(() => setVerSugerencias(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); buscar(texto) }
              }}
            />
            {verSugerencias && sugerencias.length > 0 && (
              <div className="list-group position-absolute w-100 mt-1 shadow-lg rounded-3 resultados-busqueda-mastertech"
                   style={{ zIndex: 1050 }}>
                {sugerencias.map(s => (
                  <button key={`${s.tipo}-${s.id}`} type="button"
                          className="list-group-item list-group-item-action small"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setVerSugerencias(false)
                            navigate(s.tipo === 'producto' ? `/producto/${s.id}` : s.ruta)
                          }}>
                    <i className={`bi ${s.tipo === 'producto' ? 'bi-box-seam' : 'bi-tag'} me-2 text-muted`} />
                    {s.etiqueta}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="d-flex align-items-center mt-3 mt-lg-0">
            {sesion ? (
              <Dropdown align="end" className="me-3">
                <Dropdown.Toggle variant="link" className="text-white fs-4 p-0 text-decoration-none d-flex align-items-center"
                                 aria-label="Mi cuenta">
                  <i className="bi bi-person-circle" />
                  <span className="fs-6 ms-2 d-none d-xl-inline">{sesion.nombre.split(' ')[0]}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/perfil"><i className="bi bi-person me-2" />Mi perfil</Dropdown.Item>
                  {esAdmin && (
                    <Dropdown.Item as={Link} to="/admin/productos"><i className="bi bi-speedometer2 me-2" />Panel admin</Dropdown.Item>
                  )}
                  {esDespachador && (
                      <Dropdown.Item as={Link} to="/despacho/pedidos"><i className="bi bi-truck me-2" />Despacho de pedidos</Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => { logout(); navigate('/') }}>
                    <i className="bi bi-box-arrow-right me-2" />Cerrar sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <a href="#login" className="text-white me-3 fs-4" aria-label="Iniciar sesión"
                 onClick={e => { e.preventDefault(); abrirLogin() }}>
                <i className="bi bi-person-circle" />
              </a>
            )}

            <Link to="/carrito" className="text-white fs-4 position-relative" aria-label="Carrito">
              <i className="bi bi-cart3" />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger badge-carrito"
                    style={{ fontSize: '0.6rem' }}>{cuenta}</span>
            </Link>
          </div>
        </BsNavbar.Collapse>
      </div>
    </BsNavbar>
  )
}
