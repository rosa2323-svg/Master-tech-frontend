import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import '../styles/admin.css'

const ENLACES = [
  { to: '/admin/productos', icono: 'bi-box-seam', texto: 'Productos' },
  { to: '/admin/categorias', icono: 'bi-tags', texto: 'Categorías' },
  { to: '/admin/ventas', icono: 'bi-receipt', texto: 'Ventas' },
  { to: '/admin/dashboard', icono: 'bi-bar-chart-line', texto: 'Dashboard' },
  { to: '/admin/usuarios', icono: 'bi-people', texto: 'Usuarios' },
  { to: '/admin/reembolsos', icono: 'bi-arrow-counterclockwise', texto: 'Reembolsos' },
  { to: '/admin/envios', icono: 'bi-geo-alt', texto: 'Envíos' },
  { to: '/despacho/pedidos', icono: 'bi-truck', texto: 'Despacho' },
]

export default function AdminLayout() {
  useEffect(() => {
    document.body.classList.add('modo-admin')
    return () => document.body.classList.remove('modo-admin')
  }, [])

  return (
    <>
      <nav className="navbar navbar-dark bg-dark admin-barra">
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold" to="/"><i className="bi bi-house-fill me-2" />MASTER TECH</Link>
          <div className="admin-enlaces">
            {ENLACES.map(e => (
              <NavLink key={e.to} to={e.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {e.icono && <i className={`bi ${e.icono}`} />} {e.texto}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="admin-principal">
        <Outlet />
      </main>
    </>
  )
}
