import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'

export default function DespachoLayout() {
    const { esAdmin } = useAuth()

    useEffect(() => {
        document.body.classList.add('modo-admin')
        return () => document.body.classList.remove('modo-admin')
    }, [])

    return (
        <>
            <nav className="navbar navbar-dark bg-dark admin-barra">
                <div className="container-fluid">
                    <Link className="navbar-brand fw-bold" to="/">
                        <i className="bi bi-house-fill me-2" />MASTER TECH
                    </Link>
                    <div className="admin-enlaces">
                        {esAdmin && (
                            <NavLink to="/admin/productos" className="nav-link">
                                <i className="bi bi-speedometer2" /> Panel admin
                            </NavLink>
                        )}
                        <NavLink to="/despacho/pedidos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <i className="bi bi-truck" /> Pedidos
                        </NavLink>
                        <NavLink to="/despacho/reembolsos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <i className="bi bi-arrow-counterclockwise" /> Reembolsos
                        </NavLink>
                    </div>
                </div>
            </nav>
            <main className="admin-principal">
                <Outlet />
            </main>
        </>
    )
}