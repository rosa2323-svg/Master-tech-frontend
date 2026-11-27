export interface AvisoEstado {
    ok: boolean
    texto: string
}

/** Mensaje de resultado (éxito o error) que se puede cerrar. */
export function Aviso({ aviso, onCerrar }: { aviso: AvisoEstado | null; onCerrar: () => void }) {
    if (!aviso) return null
    return (
        <div className={`alert ${aviso.ok ? 'alert-success' : 'alert-danger'} d-flex justify-content-between`} role="alert">
            <span>{aviso.texto}</span>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} />
        </div>
    )
}
