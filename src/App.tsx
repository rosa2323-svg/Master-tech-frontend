import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Cart from './pages/Cart'
import Category from './pages/Category'
import Home from './pages/Home'
import Mision from './pages/Mision'
import Nosotros from './pages/Nosotros'
import PagoConfirmar from './pages/PagoConfirmar'
import ProductDetail from './pages/ProductDetail'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Search from './pages/Search'
import Terminos from './pages/Terminos'
import AdminCategorias from './pages/admin/Categorias'
import AdminDashboard from './pages/admin/Dashboard'
import AdminProductos from './pages/admin/Productos'
import AdminUsuarios from './pages/admin/Usuarios'
import AdminVentas from './pages/admin/Ventas'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="categoria/:slug" element={<Category />} />
        <Route path="buscar" element={<Search />} />
        <Route path="producto/:id" element={<ProductDetail />} />
        <Route path="carrito" element={<Cart />} />
        <Route path="registro" element={<Register />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="mision" element={<Mision />} />
        <Route path="terminos" element={<Terminos />} />
        <Route element={<ProtectedRoute />}>
          <Route path="perfil" element={<Profile />} />
          <Route path="pago/confirmar" element={<PagoConfirmar />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute soloAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="productos" replace />} />
          <Route path="productos" element={<AdminProductos />} />
          <Route path="categorias" element={<AdminCategorias />} />
          <Route path="ventas" element={<AdminVentas />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
