import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, bot } from '../api/client'
import type { BotAccion, Producto } from '../api/types'
import { useAlert } from '../context/AlertContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { formatoSoles, imagenProducto, IMG_DEFECTO, marcaDe } from '../utils/format'

// Asistente con IA (bot-core: FastAPI + Gemini). Requiere sesión: el servidor valida el mismo JWT que Spring,
// guarda el historial en la BD y recuerda las preferencias de cada cliente. Aquí solo se pintan los mensajes.

const CLAVE_HISTORIAL_ANTIGUO = 'mastertech_chatbot_historial' // versión sin IA: guardaba el chat en el navegador
const SUGERENCIAS = ['Recomiéndame algo', 'Quiero una laptop gamer', '¿Qué compré antes?', '¿Cómo es la garantía?']

interface Mensaje { texto: string; tipo: 'bot' | 'usuario' | 'error'; hora: string; productos?: number[] }

const horaDe = (iso?: string | null) => {
  const f = iso ? new Date(iso) : new Date()
  return (isNaN(f.getTime()) ? new Date() : f).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

const bienvenida = (nombre?: string): Mensaje => ({
  texto: `Hola${nombre ? `, ${nombre.trim().split(/\s+/)[0]}` : ''}. Soy el asistente de Master Tech. Puedo ayudarte a elegir productos, revisar stock y recomendarte según lo que has comprado antes. ¿En qué te ayudo?`,
  tipo: 'bot', hora: horaDe(),
})

/** Ids de producto de las acciones `products` de una respuesta (sin repetidos). */
const idsDe = (acciones: BotAccion[] | undefined): number[] =>
  [...new Set((acciones ?? []).filter(a => a.type === 'products').flatMap(a => a.ids ?? []))]

function mensajeDeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return 'No pude comunicarme con el asistente. Inténtalo de nuevo en unos minutos.'
    if (e.status === 401) return 'No pude validar tu sesión con el asistente. Cierra sesión y vuelve a entrar.'
    if (e.status === 429) return 'Estás escribiendo muy rápido. Espera unos segundos e inténtalo otra vez.'
    if (e.status === 400) return e.message
  }
  return 'Algo salió mal con el asistente. Inténtalo de nuevo en unos minutos.'
}

/** El modelo suele responder con **negritas** y listas con guion o asterisco: se pintan sin usar HTML. */
function Formateado({ texto }: { texto: string }) {
  const nodos: ReactNode[] = []
  texto.split('\n').forEach((linea, n) => {
    if (n > 0) nodos.push('\n')
    linea.replace(/^\s*[*-]\s+/, '• ').split(/\*\*(.+?)\*\*/g).forEach((trozo, i) => {
      nodos.push(i % 2 ? <strong key={`${n}-${i}`}>{trozo}</strong> : trozo)
    })
  })
  return <>{nodos}</>
}

export default function Chatbot() {
  const { productos } = useCatalog()
  const { agregar } = useCart()
  const { mostrarAlerta } = useAlert()
  const { sesion, abrirLogin } = useAuth()
  const email = sesion?.email ?? null

  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(false)
  const [escribiendo, setEscribiendo] = useState(false)
  const [entrada, setEntrada] = useState('')
  const zona = useRef<HTMLDivElement>(null)
  const generacion = useRef(0)                       // invalida respuestas en vuelo al reiniciar o cambiar de cliente
  const conversacion = useRef<string | null>(null)   // id de la conversación en el servidor
  const nueva = useRef(false)                        // la próxima pregunta abre una conversación nueva
  const historialPedido = useRef(false)

  // Otro cliente (o cierre de sesión): nada del chat anterior debe quedar a la vista.
  useEffect(() => {
    generacion.current++
    conversacion.current = null
    nueva.current = false
    historialPedido.current = false
    setMensajes([]); setEscribiendo(false); setCargando(false); setEntrada('')
    try { localStorage.removeItem(CLAVE_HISTORIAL_ANTIGUO) } catch { /* sin almacenamiento */ }
  }, [email])

  // Al abrir el chat con sesión: trae la última conversación guardada en el servidor.
  useEffect(() => {
    if (!abierto || !email || historialPedido.current) return
    historialPedido.current = true
    const gen = generacion.current
    setCargando(true)
    bot.historial()
      .then(h => {
        if (gen !== generacion.current) return
        conversacion.current = h.conversation_id
        setMensajes(h.messages.length
          ? h.messages.map((m): Mensaje => ({
              texto: m.text, tipo: m.role === 'user' ? 'usuario' : 'bot', hora: horaDe(m.at), productos: idsDe(m.ui),
            }))
          : [bienvenida(sesion?.nombre)])
      })
      .catch(() => { if (gen === generacion.current) setMensajes([bienvenida(sesion?.nombre)]) })
      .finally(() => { if (gen === generacion.current) setCargando(false) })
  }, [abierto, email, sesion?.nombre])

  useEffect(() => { zona.current?.scrollTo({ top: zona.current.scrollHeight }) }, [mensajes, escribiendo, cargando, abierto])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const enviar = async (textoCrudo: string) => {
    const texto = textoCrudo.trim()
    if (!texto || escribiendo || cargando || !email) return
    const gen = generacion.current
    const abrirNueva = nueva.current
    setMensajes(m => [...m, { texto, tipo: 'usuario', hora: horaDe() }])
    setEscribiendo(true)
    try {
      const r = await bot.chat(texto, abrirNueva ? null : conversacion.current, abrirNueva)
      if (gen !== generacion.current) return
      nueva.current = false
      conversacion.current = r.conversation_id
      setMensajes(m => [...m, { texto: r.text, tipo: 'bot', hora: horaDe(), productos: idsDe(r.ui_actions) }])
    } catch (e) {
      if (gen !== generacion.current) return
      setMensajes(m => [...m, { texto: mensajeDeError(e), tipo: 'error', hora: horaDe() }])
    } finally {
      if (gen === generacion.current) setEscribiendo(false)
    }
  }

  const reiniciar = () => {
    generacion.current++
    conversacion.current = null
    nueva.current = true            // las preferencias que el asistente recuerda se conservan
    setEscribiendo(false)
    setMensajes([bienvenida(sesion?.nombre)])
  }

  const olvidar = async () => {
    if (escribiendo || cargando) return   // nunca borrar mientras hay un mensaje en vuelo
    if (!window.confirm('¿Borrar tu historial con el asistente y todo lo que recuerda de ti (preferencias)? No se puede deshacer.')) return
    const gen = ++generacion.current
    setEscribiendo(true)                  // bloquea el envío mientras se borra
    try {
      await bot.olvidarme()
      if (gen !== generacion.current) return
      conversacion.current = null
      nueva.current = false
      setMensajes([bienvenida(sesion?.nombre)])
      mostrarAlerta('Listo: el asistente ya no recuerda nada de ti.', true)
    } catch (e) {
      if (gen === generacion.current) mostrarAlerta(mensajeDeError(e))
    } finally {
      if (gen === generacion.current) setEscribiendo(false)   // también si falla: no deja el chat "ocupado"
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const t = entrada
    setEntrada('')
    void enviar(t)
  }

  const soloBienvenida = mensajes.length === 1 && mensajes[0].tipo === 'bot'
  const ocupado = escribiendo || cargando

  return (
    <>
      <button type="button" className={`chatbot-boton ${abierto ? 'oculto' : ''}`} aria-label="Abrir asistente"
              onClick={() => setAbierto(true)} inert={abierto}>
        <i className="bi bi-chat-dots-fill" />
      </button>

      <section className={`chatbot-panel ${abierto ? 'abierto' : ''}`} aria-label="Asistente Master Tech" inert={!abierto}>
        <header className="chatbot-cabecera">
          <div className="chatbot-avatar"><i className="bi bi-robot" /></div>
          <div className="chatbot-titulo">
            <strong>Asistente Master Tech</strong>
            <span className="chatbot-estado">En línea</span>
          </div>
          {email && (
            <>
              <button type="button" className="chatbot-accion" title="Nueva conversación" aria-label="Nueva conversación"
                      onClick={reiniciar} disabled={ocupado}>
                <i className="bi bi-arrow-counterclockwise" />
              </button>
              <button type="button" className="chatbot-accion" title="Borrar mi historial y lo que recuerdas de mí"
                      aria-label="Borrar mi historial y lo que recuerda el asistente" onClick={() => void olvidar()} disabled={ocupado}>
                <i className="bi bi-trash3" />
              </button>
            </>
          )}
          <button type="button" className="chatbot-accion" title="Cerrar" aria-label="Cerrar" onClick={() => setAbierto(false)}>
            <i className="bi bi-x-lg" />
          </button>
        </header>

        {!email ? (
          <div className="chatbot-mensajes chatbot-invitado">
            <i className="bi bi-person-lock chatbot-invitado-icono" />
            <strong>Inicia sesión para chatear</strong>
            <p>Así puedo recordar tus preferencias, conocer tus compras anteriores y retomar la conversación donde la dejaste.</p>
            <button type="button" className="chatbot-login" onClick={() => { setAbierto(false); abrirLogin() }}>Iniciar sesión</button>
            <Link className="chatbot-registro" to="/registro" onClick={() => setAbierto(false)}>Crear una cuenta</Link>
          </div>
        ) : (
          <>
            <div className="chatbot-mensajes" ref={zona} aria-live="polite">
              {mensajes.map((m, i) => {
                const lista = (m.productos ?? []).map(id => productos.find(p => p.id === id)).filter((p): p is Producto => !!p)
                return (
                  <div key={i}>
                    <div className={`chatbot-mensaje ${m.tipo}`}>
                      <Formateado texto={m.texto} /><span className="chatbot-hora">{m.hora}</span>
                    </div>
                    {lista.length > 0 && (
                      <div className="chatbot-recomendaciones">
                        {lista.map(p => (
                          <article className="chatbot-producto" key={p.id}>
                            <div className="chatbot-producto-img">
                              <img src={imagenProducto(p.imagenUrl)} alt={p.nombre}
                                   onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_DEFECTO }} />
                            </div>
                            <span className="chatbot-producto-marca">{marcaDe(p)}</span>
                            <p className="chatbot-producto-nombre">{p.nombre}</p>
                            <span className="chatbot-producto-precio">{formatoSoles(p.precio)}</span>
                            <div className="chatbot-producto-acciones">
                              <Link className="chatbot-producto-ver" to={`/producto/${p.id}`} onClick={() => setAbierto(false)}>Ver</Link>
                              <button type="button" className="chatbot-producto-agregar" disabled={p.stock <= 0}
                                      onClick={() => { const r = agregar(p); if (!r.ok) mostrarAlerta(r.mensaje ?? '') }}>
                                {p.stock <= 0 ? 'Agotado' : 'Agregar'}
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {ocupado && <div className="chatbot-escribiendo"><span /><span /><span /></div>}
            </div>

            <div className="chatbot-sugerencias">
              {soloBienvenida && !ocupado && SUGERENCIAS.map(s => (
                <button key={s} type="button" className="chatbot-sugerencia" onClick={() => void enviar(s)}>{s}</button>
              ))}
            </div>

            <form className="chatbot-formulario" onSubmit={onSubmit} autoComplete="off">
              <input type="text" className="chatbot-entrada" placeholder="Escribe tu mensaje..." maxLength={500} required
                     value={entrada} onChange={e => setEntrada(e.target.value)} disabled={ocupado} />
              <button type="submit" className="chatbot-enviar" aria-label="Enviar" disabled={ocupado}>
                <i className="bi bi-send-fill" />
              </button>
            </form>
          </>
        )}
      </section>
    </>
  )
}
