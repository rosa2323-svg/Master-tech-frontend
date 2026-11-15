import { useEffect, useMemo, useState } from 'react'
import {
  BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { api } from '../../api/client'
import type { AgrupacionTendencia, ConcentracionIngresos, IngresoDiario, IngresoPromedio, ProductosVendidos, PuntoTendencia, Usuario, Venta } from '../../api/types'
import { formatoSoles } from '../../utils/format'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const DIAS = [30, 60, 90] as const

const METRICAS = {
  unidades: { texto: 'Unidades vendidas', color: '#d62839' },
  ordenes: { texto: 'Órdenes', color: '#ffd166' },
  ingreso: { texto: 'Ingreso (S/)', color: '#06d6a0' },
} as const
type Metrica = keyof typeof METRICAS

const AGRUPACIONES: { valor: AgrupacionTendencia; texto: string }[] = [
  { valor: 'dia', texto: 'Por día' },
  { valor: 'semana', texto: 'Por semana' },
  { valor: 'mes', texto: 'Por mes' },
]

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const clave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function AdminDashboard() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dias, setDias] = useState<number>(30)
  const [agrupar, setAgrupar] = useState<AgrupacionTendencia>('dia')
  const [metrica, setMetrica] = useState<Metrica>('unidades')
  const [tendencia, setTendencia] = useState<PuntoTendencia[]>([])
  const [ingresoDia, setIngresoDia] = useState<IngresoDiario | null>(null)
  const [vendidos, setVendidos] = useState<ProductosVendidos | null>(null)
  const [promedio, setPromedio] = useState<IngresoPromedio | null>(null)
  const [concentracion, setConcentracion] = useState<ConcentracionIngresos | null>(null)

  useEffect(() => { document.title = 'MASTER TECH | Dashboard' }, [])
  useEffect(() => {
    Promise.all([api.ventas(), api.usuarios()])
        .then(([v, u]) => { setVentas(v); setUsuarios(u) })
        .catch(e => setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'))
        .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const desde = new Date(hoy); desde.setDate(hoy.getDate() - (dias - 1))
    let vigente = true
    api.tendencias(agrupar, clave(desde), clave(hoy))
        .then(t => { if (vigente) setTendencia(t) })
        .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo cargar la tendencia.') })
    return () => { vigente = false }
  }, [dias, agrupar])

  useEffect(() => {
    api.ingresoDiario()
        .then(setIngresoDia)
        .catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar el ingreso diario.'))
  }, [])

  useEffect(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const desde = new Date(hoy); desde.setDate(hoy.getDate() - (dias - 1))
    let vigente = true
    api.productosVendidos(clave(desde), clave(hoy))
        .then(p => { if (vigente) setVendidos(p) })
        .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos vendidos.') })
    return () => { vigente = false }
  }, [dias])

  useEffect(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const desde = new Date(hoy); desde.setDate(hoy.getDate() - (dias - 1))
    let vigente = true
    Promise.all([api.ingresoPromedio(clave(desde), clave(hoy)), api.concentracionIngresos(clave(desde), clave(hoy))])
        .then(([p, c]) => { if (vigente) { setPromedio(p); setConcentracion(c) } })
        .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron cargar los indicadores de ingreso.') })
    return () => { vigente = false }
  }, [dias])

  const datos = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const dias_: string[] = []
    for (let i = dias - 1; i >= 0; i--) { const d = new Date(hoy); d.setDate(hoy.getDate() - i); dias_.push(clave(d)) }
    const idx = new Set(dias_)

    const unidades: Record<string, number> = {}
    const compradores: Record<string, Set<number | string>> = {}
    const nuevos: Record<string, number> = {}
    const porProducto = new Map<string, number>()

    for (const v of ventas) {
      const k = clave(new Date(v.fecha))
      if (!idx.has(k)) continue
      unidades[k] = (unidades[k] ?? 0) + v.cantidadItems
      ;(compradores[k] ??= new Set()).add(v.usuarioId ?? v.usuarioEmail ?? v.id)
      for (const d of v.detalles) porProducto.set(d.productoNombre, (porProducto.get(d.productoNombre) ?? 0) + d.cantidad)
    }
    for (const u of usuarios) {
      if (!u.fechaRegistro) continue
      const k = clave(new Date(u.fechaRegistro))
      if (idx.has(k)) nuevos[k] = (nuevos[k] ?? 0) + 1
    }

    const top = [...porProducto.entries()].sort((a, b) => b[1] - a[1])[0]
    const compradoresDia = dias_.map(k => compradores[k]?.size ?? 0)
    const compradoresSemana = [0, 0, 0, 0, 0, 0, 0]
    dias_.forEach((k, i) => {
      const [y, m, d] = k.split('-').map(Number)
      const diaSemana = (new Date(y, m - 1, d).getDay() + 6) % 7
      compradoresSemana[diaSemana] += compradoresDia[i]
    })
    return {
      etiquetas: dias_.map(k => k.slice(5).split('-').reverse().join('/')),
      unidades: dias_.map(k => unidades[k] ?? 0),
      compradores: compradoresDia,
      compradoresSemana,
      nuevos: dias_.map(k => nuevos[k] ?? 0),
      top,
      promedioCompradores: compradoresDia.reduce((a, b) => a + b, 0) / dias_.length,
      totalNuevos: dias_.reduce((a, k) => a + (nuevos[k] ?? 0), 0),
      desde: dias_[0], hasta: dias_[dias_.length - 1],
    }
  }, [ventas, usuarios, dias])

  const opcionesBarrasClientes = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  const maxCategoria = Math.max(1, ...(vendidos?.porCategoria.map(c => c.unidades) ?? []))
  const sube = (ingresoDia?.variacionPct ?? 0) >= 0

  const opcionesBarras = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (c: { parsed: { y: number | null } }) =>
              metrica === 'ingreso' ? formatoSoles(c.parsed.y ?? 0) : String(c.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  return (
      <>
        <div className="admin-encabezado">
          <div>
            <h1 className="admin-titulo">Indicadores (KPI)</h1>
            <p className="admin-subtitulo">Resumen de ventas y usuarios de Master Tech, calculado con los datos reales de la tienda.</p>
          </div>
          <div>
            <div className="btn-group" role="group" id="filtroDias" aria-label="Filtro de tiempo">
              {DIAS.map(d => (
                  <button key={d} type="button" className={`btn btn-outline-dark ${dias === d ? 'active' : ''}`} aria-pressed={dias === d}
                          onClick={() => setDias(d)}>{d} días</button>
              ))}
            </div>
            <div className="texto-tenue small mt-1 text-end">Del {datos.desde} al {datos.hasta}</div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4"><div className="card shadow-sm h-100"><div className="card-body">
            <p className="text-muted small mb-1">Producto más vendido</p>
            <h5 className="fw-bold mb-1">{cargando ? '-' : datos.top ? datos.top[0] : 'Sin ventas en el periodo'}</h5>
            <small className="text-muted">{datos.top ? `${datos.top[1]} unidades` : ''}</small>
          </div></div></div>
          <div className="col-6 col-md-4"><div className="card shadow-sm h-100"><div className="card-body">
            <p className="text-muted small mb-1">Clientes con compra (promedio diario)</p>
            <h3 className="fw-bold mb-0">{cargando ? '-' : datos.promedioCompradores.toFixed(1)}</h3>
          </div></div></div>
          <div className="col-6 col-md-4"><div className="card shadow-sm h-100"><div className="card-body">
            <p className="text-muted small mb-1">Usuarios nuevos (total del periodo)</p>
            <h3 className="fw-bold mb-0">{cargando ? '-' : datos.totalNuevos}</h3>
          </div></div></div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6"><div className="card shadow-sm h-100"><div className="card-body">
            <p className="text-muted small mb-1">Ingreso diario (hoy)</p>
            <h3 className="fw-bold mb-1">{ingresoDia ? formatoSoles(ingresoDia.hoy) : '-'}</h3>
            {ingresoDia && (
                ingresoDia.variacionPct == null
                    ? <small className="text-muted">Sin ingreso ayer para comparar</small>
                    : <small className={sube ? 'text-success' : 'text-danger'}>
                      {sube ? '▲' : '▼'} {Math.abs(ingresoDia.variacionPct)}% vs ayer ({formatoSoles(ingresoDia.ayer)})
                    </small>
            )}
          </div></div></div>
          <div className="col-12 col-md-6"><div className="card shadow-sm h-100"><div className="card-body">
            <p className="text-muted small mb-1">Ingreso promedio (periodo)</p>
            <h3 className="fw-bold mb-1">
              {promedio ? formatoSoles(promedio.promedioDiario) : '-'} <small className="fs-6 text-muted">/ día</small>
            </h3>
            <small className="text-muted">
              {promedio ? `Ticket promedio: ${formatoSoles(promedio.ticketPromedio)} por orden (${promedio.ordenes} órdenes)` : ''}
            </small>
          </div></div></div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12"><div className="card shadow-sm"><div className="card-body">
            <div className="d-flex justify-content-between align-items-baseline mb-2">
              <h6 className="fw-bold mb-0">Productos vendidos</h6>
              <span className="text-muted small">{vendidos ? `${vendidos.totalUnidades} unidades en el periodo` : '-'}</span>
            </div>
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <p className="text-muted small mb-2">Por categoría</p>
                {vendidos?.porCategoria.length === 0 && <small className="text-muted">Sin ventas en el periodo</small>}
                {vendidos?.porCategoria.map(c => (
                    <div key={c.id} className="mb-2">
                      <div className="d-flex justify-content-between small">
                        <span>{c.nombre}</span><span>{c.unidades} u. · {formatoSoles(c.ingreso)}</span>
                      </div>
                      <div className="progress" style={{ height: 6 }} role="progressbar" aria-label={`${c.nombre}: ${c.unidades} unidades`}>
                        <div className="progress-bar" style={{ width: `${(c.unidades / maxCategoria) * 100}%`, backgroundColor: '#d62839' }} />
                      </div>
                    </div>
                ))}
              </div>
              <div className="col-12 col-md-6">
                <p className="text-muted small mb-2">Top 5 productos</p>
                <ol className="ps-3 mb-0">
                  {vendidos?.topProductos.map(p => (
                      <li key={p.id} className="small">{p.nombre} <span className="text-muted">— {p.unidades} u. ({formatoSoles(p.ingreso)})</span></li>
                  ))}
                </ol>
              </div>
            </div>
          </div></div></div>

          <div className="col-12"><div className="card shadow-sm"><div className="card-body">
            <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mb-2">
              <h6 className="fw-bold mb-0">Concentración de ingresos por producto</h6>
              <span className="text-muted small">
              {concentracion ? `Los 5 principales concentran ${concentracion.top5Pct}% de ${formatoSoles(concentracion.totalIngreso)}` : '-'}
            </span>
            </div>
            {concentracion?.productos.length === 0 && <small className="text-muted">Sin ventas en el periodo</small>}
            {concentracion?.productos.map(p => (
                <div key={p.id} className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>{p.nombre}</span><span>{p.porcentaje}% · {formatoSoles(p.ingreso)}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }} role="progressbar" aria-label={`${p.nombre}: ${p.porcentaje}% del ingreso`}>
                    <div className="progress-bar" style={{ width: `${p.porcentaje}%`, backgroundColor: '#06d6a0' }} />
                  </div>
                </div>
            ))}
            {concentracion && concentracion.otrosPct > 0 && (
                <div className="mb-0">
                  <div className="d-flex justify-content-between small text-muted">
                    <span>Otros productos</span><span>{concentracion.otrosPct}% · {formatoSoles(concentracion.otrosIngreso)}</span>
                  </div>
                  <div className="progress" style={{ height: 6 }} role="progressbar" aria-label={`Otros productos: ${concentracion.otrosPct}% del ingreso`}>
                    <div className="progress-bar bg-secondary" style={{ width: `${concentracion.otrosPct}%` }} />
                  </div>
                </div>
            )}
          </div></div></div>
        </div>

        <div className="row g-4">
          <div className="col-12"><div className="card shadow-sm"><div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <h6 className="fw-bold mb-0">Tendencia de ventas</h6>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm w-auto" aria-label="Métrica" value={metrica}                        onChange={e => setMetrica(e.target.value as Metrica)}>
                  {(Object.keys(METRICAS) as Metrica[]).map(m => <option key={m} value={m}>{METRICAS[m].texto}</option>)}
                </select>
                <select className="form-select form-select-sm" aria-label="Agrupar por" value={agrupar}
                        onChange={e => setAgrupar(e.target.value as AgrupacionTendencia)}>
                  {AGRUPACIONES.map(g => <option key={g.valor} value={g.valor}>{g.texto}</option>)}
                </select>
              </div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 320 }}>
              <Bar options={opcionesBarras} data={{ labels: tendencia.map(p => p.etiqueta), datasets: [
                  { label: METRICAS[metrica].texto, data: tendencia.map(p => p[metrica]), backgroundColor: METRICAS[metrica].color, borderRadius: 4, maxBarThickness: 28 },
                ] }} aria-label="Gráfico de barras con la tendencia de ventas" role="img" />
            </div>
          </div></div></div>
          <div className="col-12 col-lg-6"><div className="card shadow-sm"><div className="card-body">
            <h6 className="fw-bold mb-0">Frecuencia de compra</h6>
            <p className="text-muted small mb-4">Clientes con compra según el día de la semana (total del periodo)</p>
            <div style={{ position: 'relative', width: '100%', height: 260 }}>
              <Bar options={opcionesBarrasClientes} data={{ labels: DIAS_SEMANA, datasets: [
                  { label: 'Clientes con compra', data: datos.compradoresSemana, backgroundColor: '#06d6a0', borderRadius: 4, maxBarThickness: 40 },
                ] }} aria-label="Gráfico de barras con los clientes con compra por día de la semana" role="img" />
            </div>
          </div></div></div>
          <div className="col-12 col-lg-6"><div className="card shadow-sm"><div className="card-body">
            <h6 className="fw-bold mb-0">Usuarios nuevos</h6>
            <p className="text-muted small mb-4">Registros por día</p>
            <div style={{ position: 'relative', width: '100%', height: 260 }}>
              <Bar options={opcionesBarrasClientes} data={{ labels: datos.etiquetas, datasets: [
                  { label: 'Usuarios nuevos', data: datos.nuevos, backgroundColor: '#ffd166', borderRadius: 4, maxBarThickness: 28 },
                ] }} aria-label="Gráfico de barras con los usuarios nuevos por día" role="img" />
            </div>
          </div></div></div>
        </div>
      </>
  )
}