import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Rol } from '../api/types'
import { useAuth } from '../context/AuthContext'

/**
 * Exige sesión. Con soloAdmin pide rol ADMIN; con roles pide que el rol del usuario esté en la lista.
 * Sin sesión abre el modal de login y vuelve al inicio.
 */
export default function ProtectedRoute({ soloAdmin = false, roles }: { soloAdmin?: boolean; roles?: Rol[] }) {
  const { sesion, esAdmin, cargando, abrirLogin } = useAuth()
  const sinSesion = !cargando && !sesion

  useEffect(() => { if (sinSesion) abrirLogin() }, [sinSesion, abrirLogin])

  if (cargando) return <div className="container py-5 text-center text-muted">Cargando…</div>
  if (!sesion) return <Navigate to="/" replace />
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />
  if (roles && !roles.includes(sesion.rol)) return <Navigate to="/" replace />
  return <Outlet />
}