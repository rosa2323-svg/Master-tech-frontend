import { useEffect } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import '../styles/admin.css'

export default function DespachoLayout() {
    useEffect(() => {
        document.body.classList.add('modo-admin')
        return () => document.body.classList.remove('modo-admin')
    }, [])

    return (
        <>
            <nav className="navbar navbar-dark bg-dark admin-barra">
                <div className="container-fluid">
                    <Link className="navbar-brand fw-bold" to="/">MASTER TECH</Link>
                    <div className="admin-enlaces">
                        <NavLink to="/despacho/pedidos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Pedidos
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