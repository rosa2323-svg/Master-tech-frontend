import { useState } from 'react'
import EntregaDomicilio from './EntregaDomicilio'
import EntregaRecojo from './EntregaRecojo'
import type { SeleccionEntrega } from '../utils/entregaTipos'

interface Props {
  items: { productoId: number; cantidad: number }[]
  /** null mientras falte algún dato o la zona no tenga cobertura. */
  onCambio: (seleccion: SeleccionEntrega | null) => void
}

type Tipo = 'DOMICILIO' | 'RECOJO'

/** Elección entre envío a domicilio y recojo en tienda. */
export default function EntregaPedido({ items, onCambio }: Props) {
  const [tipo, setTipo] = useState<Tipo>('DOMICILIO')

  return (
    <div className="mb-3">
      <h6 className="fw-bold mb-2"><i className="bi bi-box-seam me-1" />¿Cómo quieres recibirlo?</h6>
      <div className="btn-group w-100 mb-3" role="group" aria-label="Tipo de entrega">
        <button type="button" className={`btn btn-sm ${tipo === 'DOMICILIO' ? 'btn-dark' : 'btn-outline-dark'}`}
                aria-pressed={tipo === 'DOMICILIO'} onClick={() => setTipo('DOMICILIO')}>
          <i className="bi bi-truck me-1" />A domicilio
        </button>
        <button type="button" className={`btn btn-sm ${tipo === 'RECOJO' ? 'btn-dark' : 'btn-outline-dark'}`}
                aria-pressed={tipo === 'RECOJO'} onClick={() => setTipo('RECOJO')}>
          <i className="bi bi-shop me-1" />Recojo en tienda
        </button>
      </div>
      {tipo === 'DOMICILIO'
        ? <EntregaDomicilio items={items} onCambio={onCambio} />
        : <EntregaRecojo items={items} onCambio={onCambio} />}
    </div>
  )
}
