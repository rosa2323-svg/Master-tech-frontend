import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Cliente = typeof import('../api/client')

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })

async function cargarCliente(urls = 'http://a.test,http://b.test'): Promise<Cliente> {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', urls)
  return import('../api/client')
}

function almacenFalso() {
  const datos = new Map<string, string>()
  return {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => { datos.set(k, v) },
    removeItem: (k: string) => { datos.delete(k) },
  }
}

describe('cliente del API: respaldo entre servidores', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('localStorage', almacenFalso())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  const urlsLlamadas = () => fetchMock.mock.calls.map(c => String(c[0]))

  it('una lectura (GET) pasa al siguiente servidor si el primero no responde', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(json([{ id: 1 }]))
    const { api } = await cargarCliente()

    const datos = await api.productos()

    expect(datos).toEqual([{ id: 1 }])
    expect(urlsLlamadas()).toEqual(['http://a.test/api/v1/productos', 'http://b.test/api/v1/productos'])
  })

  it('una lectura pasa al siguiente servidor si el primero responde 503 (dormido)', async () => {
    fetchMock
      .mockResolvedValueOnce(json({}, 503))
      .mockResolvedValueOnce(json([]))
    const { api } = await cargarCliente()

    await expect(api.productos()).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('un 404 o 500 es una respuesta real: no se reintenta en otro servidor', async () => {
    fetchMock.mockResolvedValueOnce(json({ message: 'Falló algo' }, 500))
    const { api, ApiError } = await cargarCliente()

    await expect(api.productos()).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('una escritura (PATCH) NO se reenvía a otro servidor si falla la red', async () => {
    fetchMock.mockRejectedValue(new TypeError('network'))
    const { api, ApiError } = await cargarCliente()

    const error = await api.cambiarActivoProducto(1, true).catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.esDeRed).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(urlsLlamadas()[0]).toBe('http://a.test/api/v1/productos/1/activo')
  })

  it('una escritura con 503 tampoco se reenvía', async () => {
    fetchMock.mockResolvedValue(json({}, 503))
    const { api } = await cargarCliente()

    await expect(api.cambiarActivoProducto(1, false)).rejects.toMatchObject({ status: 503 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('las escrituras usan el servidor que funcionó en la última lectura', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('network')) // GET a.test
      .mockResolvedValueOnce(json([]))                 // GET b.test
      .mockResolvedValueOnce(json({ id: 1, activo: true })) // PATCH
    const { api } = await cargarCliente()

    await api.productos()
    await api.cambiarActivoProducto(1, true)

    expect(urlsLlamadas()[2]).toBe('http://b.test/api/v1/productos/1/activo')
  })
})

describe('cliente del API: respuestas y errores', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('localStorage', almacenFalso())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })
  const fetchMock = () => globalThis.fetch as unknown as ReturnType<typeof vi.fn>

  it('204 devuelve undefined', async () => {
    fetchMock().mockResolvedValueOnce(new Response(null, { status: 204 }))
    const { api } = await cargarCliente('http://a.test')

    await expect(api.cambiarActivoProducto(1, true)).resolves.toBeUndefined()
  })

  it('usa el mensaje del backend y añade la referencia de un 500', async () => {
    fetchMock().mockResolvedValueOnce(json({ message: 'Ocurrió un error inesperado.', referencia: 'AB12CD' }, 500))
    const { api } = await cargarCliente('http://a.test')

    const error = await api.productos().catch(e => e)

    expect(error.message).toBe('Ocurrió un error inesperado. (Ref: AB12CD)')
    expect(error.referencia).toBe('AB12CD')
  })

  it('conserva los errores por campo de una validación', async () => {
    fetchMock().mockResolvedValueOnce(json({ message: 'Datos inválidos', fieldErrors: { nombre: 'Obligatorio' } }, 400))
    const { api } = await cargarCliente('http://a.test')

    const error = await api.productos().catch(e => e)

    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({ nombre: 'Obligatorio' })
  })

  it('un 404 «Recurso no encontrado» explica que el backend puede ser una versión anterior', async () => {
    fetchMock().mockResolvedValueOnce(json({ message: 'Recurso no encontrado' }, 404))
    const { api } = await cargarCliente('http://a.test')

    const error = await api.productos().catch(e => e)

    expect(error.message).toContain('versión anterior del backend')
  })

  it('sin cuerpo usa un mensaje por código HTTP', async () => {
    fetchMock().mockResolvedValueOnce(new Response('', { status: 403 }))
    const { api } = await cargarCliente('http://a.test')

    const error = await api.productos().catch(e => e)

    expect(error.message).toBe('No tienes permisos para esta acción.')
  })

  it('un 200 que no es JSON se rechaza con un mensaje claro', async () => {
    fetchMock().mockResolvedValueOnce(new Response('<html>proxy</html>', { status: 200 }))
    const { api } = await cargarCliente('http://a.test')

    const error = await api.productos().catch(e => e)

    expect(error.message).toContain('respuesta inesperada')
  })

  it('un 401 con sesión guardada avisa para cerrar la sesión; sin sesión no', async () => {
    const { api, tokenStore, registrarOnNoAutorizado } = await cargarCliente('http://a.test')
    const alCerrar = vi.fn()
    registrarOnNoAutorizado(alCerrar)

    fetchMock().mockResolvedValueOnce(json({ message: 'Debes iniciar sesión' }, 401))
    await api.productos().catch(() => undefined)
    expect(alCerrar).not.toHaveBeenCalled()

    tokenStore.set('token-viejo')
    fetchMock().mockResolvedValueOnce(json({ message: 'Debes iniciar sesión' }, 401))
    await api.productos().catch(() => undefined)
    expect(alCerrar).toHaveBeenCalledTimes(1)
  })

  it('envía el token en la cabecera Authorization', async () => {
    const { api, tokenStore } = await cargarCliente('http://a.test')
    tokenStore.set('abc')
    fetchMock().mockResolvedValueOnce(json([]))

    await api.productos(true)

    const [url, init] = fetchMock().mock.calls[0]
    expect(String(url)).toBe('http://a.test/api/v1/productos?todos=true')
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer abc' })
  })

  it('mensajeError solo muestra el texto de un ApiError', async () => {
    const { ApiError, mensajeError } = await cargarCliente('http://a.test')
    const consola = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(mensajeError(new ApiError(400, 'Dato inválido'), 'Por defecto')).toBe('Dato inválido')
    expect(mensajeError(new TypeError('x is undefined'), 'Por defecto')).toBe('Por defecto')
    consola.mockRestore()
  })
})
