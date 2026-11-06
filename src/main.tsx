import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/estilos.css'
import './styles/chatbot.css'
import App from './App'
import { AlertProvider } from './context/AlertContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import { IMG_DEFECTO } from './utils/format'

document.addEventListener(
    'error',
    (e) => {
      const el = e.target
      if (el instanceof HTMLImageElement && !el.src.endsWith(IMG_DEFECTO)) {
        el.src = IMG_DEFECTO
      }
    },
    true
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AlertProvider>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  </StrictMode>,
)
