import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductGrid from '../components/ProductGrid'
import { useCatalog } from '../context/CatalogContext'
import { normalizar } from '../utils/format'

export default function Search() {
  const [params] = useSearchParams()
  const termino = params.get('query') ?? ''
  const { productos, categorias, cargando } = useCatalog()

  useEffect(() => { document.title = `Resultados para "${termino}" | MASTER TECH` }, [termino])

  const resultados = useMemo(() => {
    const t = normalizar(termino)
    if (!t) return productos
    const nombreCat = (id: number) => categorias.find(c => c.id === id)?.nombre ?? ''
    return productos.filter(p =>
      normalizar(p.nombre).includes(t) ||
      normalizar(p.marca ?? '').includes(t) ||
      normalizar(p.codigo ?? '').includes(t) ||
      normalizar(p.descripcion ?? '').includes(t) ||
      normalizar(p.categoriaNombre ?? nombreCat(p.categoriaId)).includes(t))
  }, [termino, productos, categorias])

  return (
    <div className="container py-5">
      <h4 className="fw-bold mb-1">Resultados para: <span className="text-danger">"{termino}"</span></h4>
      <p className="text-muted small mb-4">{cargando ? '…' : resultados.length} producto(s) encontrado(s)</p>
      {cargando ? <p className="text-muted">Cargando…</p> : <ProductGrid productos={resultados} termino={termino} />}
    </div>
  )
}
