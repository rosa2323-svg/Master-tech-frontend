# Master Tech — Tienda web de tecnología y servicios tecnicos 

Tienda web para artículos de tecnología (laptops, computadoras, teléfonos, tablets, accesorios y componentes), con catálogo de productos, packs promocionales y sección de servicio técnico.

**Stack tecnológico:** HTML5, CSS3, JavaScript

---

## 1. Instalación y ejecución

Este proyecto no requiere instalación de dependencias ni build, ya que es HTML/CSS/JS puro.

```bash
# 1. Clonar el repositorio
git clone https://github.com/rosa2323-svg/Herramientas01.git

# 2. Abrir html/Index.html directamente en el navegador
# o usar la extensión "Live Server" en tu editor para verlo con recarga automática
```

---

## 2. Estructura del proyecto
Herramientas01/
├── CSS/
│ └── estilos.css # Estilos generales del sitio
├── html/
│ ├── registro.html # Registro/login de usuario
│ ├── nosotros.html # Página "Nosotros"
│ └── mision.html # Misión y visión
├── Imagenes/
│ └── ... # Íconos, banners, imágenes de productos y packs
├── JS/
│ ├── emergente.js # Ventanas/modales emergentes
│ └── solicitarlogin.js # Lógica del formulario de login
├── index.html # Página principal (catálogo, banner, packs)
└── README.md

---

## 3. Flujo de trabajo (Git Flow)

| Rama | Responsable de |
|---|---|
| `principal` | Versión estable/final |
| `desarrollar` | Integración de todas las features |
| `feature/vistas-html` | Estructura HTML de las páginas |
| `feature/diseño-css` | Estilos y diseño visual |
| `feature/logica-js` | Funcionalidad JavaScript |
| `imagen de recursos/característica` | Imágenes y recursos gráficos |
| `feature/compatibilidad-navegadores` | Ajustes de compatibilidad entre navegadores |
| `bugfix/error-vistas-html` | Corrección de errores en las vistas HTML |
| `bugfix/error-design-css` | Corrección de errores de estilos y diseño |

**Reglas de protección de ramas:**
- `main` y `develop` requieren Pull Request + 2 aprobaciones + resolución de conversaciones antes de mergear
- Las ramas `feature/*` no requieren PR, para agilizar el trabajo individual antes de integrar a `develop`
