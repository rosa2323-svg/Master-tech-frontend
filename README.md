# Master-tech-frontend — Tienda web de tecnología y servicios técnicos

Tienda web para artículos de tecnología (laptops, computadoras, teléfonos, tablets, accesorios y componentes), con catálogo de productos, buscador, packs promocionales y sección de servicio técnico.

**Stack tecnológico:** HTML5, CSS3, JavaScript, Bootstrap 5 y Bootstrap Icons (por CDN)

## 1. Instalación y ejecución

Este proyecto no requiere instalación de dependencias ni build, ya que es HTML/CSS/JS puro.

```bash
# 1. Clonar el repositorio
git clone https://github.com/rosa2323-svg/Master-tech-frontend.git

# 2. Abrir index.html directamente en el navegador
# o usar la extensión "Live Server" en tu editor para verlo con recarga automática
```

## 2. Estructura del proyecto

```text
Master-tech-frontend/
├── .github/
├── .idea/
├── CSS/
│   ├── admin.css
│   └── estilos.css
├── html/
│   ├── admin-categorias.html
│   ├── admin-productos.html
│   ├── admin-ventas.html
│   ├── carrito.html
│   ├── categoria.html
│   ├── mision.html
│   ├── nosotros.html
│   ├── perfil.html
│   ├── producto.html
│   ├── registro.html
│   └── resultados-busqueda.html
├── Imagenes/
├── JS/
│   ├── admin-categorias.js
│   ├── admin-comun.js
│   ├── admin-productos.js
│   ├── admin-ventas.js
│   ├── almacen.js
│   ├── buscador.js
│   ├── carrito.js
│   ├── categoria.js
│   ├── emergente.js
│   ├── perfil.js
│   ├── producto.js
│   ├── productos.js
│   ├── renderizado.js
│   └── solicitarlogin.js
├── .coderabbit.yaml
├── index.html
└── README.md
```

## 3. Flujo de trabajo (Git Flow)

El proyecto sigue un enfoque basado en Git Flow, estructurado en ramas principales persistentes y ramas efímeras que se crean y eliminan según las necesidades de desarrollo del equipo.

### Ramas Principales
- `main`: Contiene la versión estable y final del proyecto (código de producción).
- `develop`: Rama base de integración. Todas las nuevas características se unen aquí antes de pasar a la rama principal.

### Nomenclatura de Ramas Efímeras
Las ramas de trabajo se crean a partir de `develop` y utilizan los siguientes prefijos según su propósito:
- `feature/*`: Desarrollo de nuevas funcionalidades, vistas HTML, diseños CSS o lógica en JS (ej. `feature/carrito`, `feature/admin-panel`).
- `bugfix/*`: Corrección de errores detectados en desarrollo.
- `hotfix/*`: Corrección de errores críticos detectados en producción.
- `react/*`: Ramas específicas destinadas a la migración progresiva del proyecto hacia la tecnología React.

### Reglas de protección y revisión de código:

- **Integración de Bots de IA:** Para mantener la calidad del código, los repositorios cuentan con la integración de **CodeRabbit** y **GitHub Copilot**. Estos bots realizan revisiones automáticas en los Pull Requests, sugiriendo mejoras y detectando problemas potenciales.
- Las ramas `main` y `develop` están protegidas. Requieren **Pull Request + 1 aprobación + resolución de conversaciones** antes de poder hacer el merge.
- Las ramas de trabajo individual (`feature/*`, `bugfix/*`, etc.) **no** requieren PR para los commits diarios, agilizando el desarrollo hasta el momento de su integración definitiva hacia `develop`.