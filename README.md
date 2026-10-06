# Master-tech-frontend — Tienda web de tecnología y servicios técnicos

Tienda web para artículos de tecnología (laptops, computadoras, teléfonos, tablets, accesorios y componentes), con catálogo de productos, buscador, packs promocionales y sección de servicio técnico.

**Stack tecnológico:** HTML5, CSS3, JavaScript, Bootstrap 5 y Bootstrap Icons (por CDN)

---

## 1. Instalación y ejecución

Este proyecto no requiere instalación de dependencias ni build, ya que es HTML/CSS/JS puro.

```bash
# 1. Clonar el repositorio
git clone https://github.com/rosa2323-svg/Master-tech-frontend.git

# 2. Abrir index.html directamente en el navegador
# o usar la extensión "Live Server" en tu editor para verlo con recarga automática
```

---

## 2. Estructura del proyecto
Master-tech-frontend/
├── .github/ # Configuración de GitHub
├── .coderabbit.yaml # Configuración de la revisión automática de PR
├── CSS/
│ └── estilos.css # Estilos generales del sitio
├── html/
│ ├── categoria.html # Listado de productos por categoría
│ ├── mision.html # Misión y visión
│ ├── nosotros.html # Página "Nosotros"
│ ├── perfil.html # Perfil de usuario e historial de compras
│ ├── registro.html # Registro/login de usuario
│ └── resultados-busqueda.html # Resultados del buscador
├── Imagenes/
│ └── ... # Íconos, banners, imágenes de productos y packs
├── JS/
│ ├── buscador.js # Buscador y sugerencias
│ ├── categoria.js # Lógica de la vista de categoría
│ ├── emergente.js # Ventanas/modales emergentes
│ ├── perfil.js # Historial de compras y datos del perfil
│ ├── productos.js # Datos de los productos
│ ├── renderizado.js # Dibujado de tarjetas de producto
│ └── solicitarlogin.js # Lógica del formulario de login
├── index.html # Página principal (catálogo, banner, packs)
└── README.md

---

## 3. Flujo de trabajo (Git Flow)

| Rama | Responsable de |
|---|---|
| `main` | Versión estable/final |
| `develop` | Integración de todas las features |
| `feature/vistas-html` | Estructura HTML de las páginas |
| `feature/diseno-css` | Estilos y diseño visual |
| `feature/diseno-css-responsive` | Diseño responsive |
| `feature/recursos-img` | Imágenes y recursos gráficos |
| `feature/compatibilidad-navegadores` | Ajustes de compatibilidad entre navegadores |
| `feature/logica-carrito` | Lógica del carrito de compras |
| `feature/logica-busqueda` | Lógica del buscador |
| `feature/checkout-auth` | Checkout y autenticación |
| `feature/admin-productos` | Administración de productos |
| `feature/admin-categorias` | Administración de categorías |
| `feature/admin-ventas` | Administración de ventas |
| `migracion-react` | Migración del proyecto a React |
| `react/base-catalogo` | Base del catálogo en React |
| `react/carrito-usuario` | Carrito del usuario en React |
| `react/diseno-ventas` | Diseño de la vista de ventas en React |
| `react/index-admin` | Página principal del panel de administración en React |
| `bugfix/error-vistas-html` | Corrección de errores en las vistas HTML |

**Reglas de protección de ramas:**
- `main` y `develop` requieren Pull Request + 2 aprobaciones + resolución de conversaciones antes de mergear
- Las ramas `feature/*` no requieren PR, para agilizar el trabajo individual antes de integrar a `develop`