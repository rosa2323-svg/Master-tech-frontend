import { useEffect, useState } from 'react'
import CalendarioTab from './envios/CalendarioTab'
import SedesTab from './envios/SedesTab'
import TarifasTab from './envios/TarifasTab'

type Pestana = 'sedes' | 'tarifas' | 'calendario'

const PESTANAS: { id: Pestana; texto: string; icono: string }[] = [
    { id: 'sedes', texto: 'Almacenes', icono: 'bi-geo-alt' },
    { id: 'tarifas', texto: 'Tarifas', icono: 'bi-cash-coin' },
    { id: 'calendario', texto: 'Calendario y corte', icono: 'bi-calendar-event' },
]

export default function AdminEnvios() {
    const [pestana, setPestana] = useState<Pestana>('sedes')

    useEffect(() => { document.title = 'MASTER TECH | Admin de envíos' }, [])

    return (
        <>
            <div className="admin-encabezado">
                <div>
                    <h1 className="admin-titulo">Configuración de envíos</h1>
                    <p className="admin-subtitulo">
                        Almacenes de reparto, tarifas por distancia (en soles), hora de corte y feriados. Los días hábiles son de lunes a sábado.
                    </p>
                </div>
            </div>

            <div className="d-flex gap-2 flex-wrap mb-3" role="tablist" aria-label="Secciones de envíos">
                {PESTANAS.map(p => (
                    <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id}
                            className={`btn ${pestana === p.id ? 'btn-mastertech' : 'btn-outline-secondary'}`}
                            onClick={() => setPestana(p.id)}>
                        <i className={`bi ${p.icono} me-1`} />{p.texto}
                    </button>
                ))}
            </div>

            {pestana === 'sedes' && <SedesTab />}
            {pestana === 'tarifas' && <TarifasTab />}
            {pestana === 'calendario' && <CalendarioTab />}
        </>
    )
}
