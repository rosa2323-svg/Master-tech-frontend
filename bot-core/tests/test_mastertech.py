"""Proyecto Mastertech: busqueda, personalizacion, contexto, historial y cliente HTTP (httpx simulado)."""
import time

import jwt
import pytest

from bot_core.auth import verify_token
from bot_core.engine import BotEngine
from bot_core.llm import LLMResponse, ToolCall
from bot_core.stores import InMemoryStore
from conftest import FakeLLM, SECRET, principal

from projects.mastertech import catalog as cat

PRODUCTOS = [
    dict(id=1, nombre="Laptop Lenovo LOQ Ryzen 7 16GB", descripcion="Laptop gamer 512GB", precio=3899, marca="Lenovo", stock=5, categoriaId=1, categoriaNombre="Laptops"),
    dict(id=2, nombre="Laptop HP 15 Core i5", descripcion="Para estudio y oficina", precio=2299, marca="HP", stock=8, categoriaId=1, categoriaNombre="Laptops"),
    dict(id=3, nombre="iPhone 15 256GB", descripcion="Smartphone Apple", precio=4199, marca="Apple", stock=3, categoriaId=2, categoriaNombre="Teléfonos"),
    dict(id=4, nombre="Samsung Galaxy A55", descripcion="Android gama media", precio=1599, marca="Samsung", stock=0, categoriaId=2, categoriaNombre="Teléfonos"),
    dict(id=5, nombre="Mouse Logitech G203", descripcion="Mouse gamer RGB", precio=89, marca="Logitech", stock=20, categoriaId=3, categoriaNombre="Accesorios"),
    dict(id=6, nombre="PlayStation 5 Slim", descripcion="Consola digital 825GB", precio=2199, marca="Sony", stock=2, categoriaId=4, categoriaNombre="Consolas"),
    dict(id=7, nombre="Laptop ASUS TUF Gaming Ryzen 5", descripcion="Laptop 144Hz", precio=3199, marca="ASUS", stock=4, categoriaId=1, categoriaNombre="Laptops"),
]
CATEGORIAS = [dict(id=1, nombre="Laptops"), dict(id=2, nombre="Teléfonos"), dict(id=3, nombre="Accesorios"), dict(id=4, nombre="Consolas")]
PEDIDO = dict(id=10, fecha="2026-10-12T14:33:00", total=3899, cantidadItems=1, numeroOrden="MT-0010", estado="Pagado",
              detalles=[dict(id=1, cantidad=1, precioUnitario=3899, subtotal=3899, productoId=1, productoNombre="Laptop Lenovo LOQ Ryzen 7 16GB")])


class FakeApi:
    """Sustituye a MastertechBackend: los datos del cliente dependen del token, como en Spring."""
    def __init__(self, productos=PRODUCTOS, pedidos=None, perfiles=None):
        self.productos = productos
        self.ped = pedidos if pedidos is not None else {"tok": [PEDIDO]}
        self.perf = perfiles if perfiles is not None else {
            "tok": dict(nombre="Ana Pérez", email="ana@correo.com", dni="12345678", direccion="Av. Secreta 123",
                        numeroTelefono="987654321", fechaRegistro="2026-03-05T10:00:00")}

    async def catalogo(self): return self.productos
    async def categorias(self): return CATEGORIAS
    async def perfil(self, token): return self.perf.get(token, {})
    async def pedidos(self, token): return self.ped.get(token, [])


class FakeSpecs:
    pool = None
    async def para(self, ids): return {1: [{"nombre": "RAM", "valor": "16 GB"}]} if 1 in ids else {}


def _engine(settings, script=None, api=None):
    from projects.mastertech.project import MastertechProject
    proj = MastertechProject(api or FakeApi(), FakeSpecs())
    llm = FakeLLM(script)
    return BotEngine(settings, InMemoryStore(), llm, proj), proj, llm


# ------------------------------------------------------------------ auth: JWT de Spring
def test_jwt_from_spring_hs384_no_issuer_no_name():
    # jjwt firma con HS384 si el secreto tiene >= 48 bytes; sub = email; sin iss ni nombre
    secret = "s" * 48
    tok = jwt.encode({"sub": "ana@correo.com", "rol": "USER", "exp": int(time.time()) + 600}, secret, algorithm="HS384")
    p = verify_token(tok, secret, "", default_role="USER")
    assert (p.user_id, p.role, p.name) == ("ana@correo.com", "USER", "")


# ------------------------------------------------------------------ catalogo
def ids(res): return [p["id"] for p in res[0]]


def test_search_ignores_accents_plurals_synonyms_and_stock():
    assert ids(cat.buscar(PRODUCTOS, "celulares")) == [3]                      # iPhone; el Galaxy esta agotado
    assert set(ids(cat.buscar(PRODUCTOS, "telefono", solo_con_stock=False))) == {3, 4}
    assert 6 in ids(cat.buscar(PRODUCTOS, "ps5"))


def test_search_requires_all_words_and_filters():
    assert set(ids(cat.buscar(PRODUCTOS, "laptop gamer"))) == {1, 7}
    assert ids(cat.buscar(PRODUCTOS, categoria="laptops", precio_max=3000)) == [2]
    assert ids(cat.buscar(PRODUCTOS, marca="logitech")) == [5]
    assert ids(cat.buscar(PRODUCTOS, categoria="laptops", orden="precio_asc")) == [2, 7, 1]
    res, total = cat.buscar(PRODUCTOS, "laptop", limite=2)
    assert len(res) == 2 and total == 3


def test_ficha_warns_low_stock_and_formats_soles():
    f = cat.ficha(PRODUCTOS[2])
    assert f["precio_texto"] == "S/ 4,199.00" and f["aviso"] == "quedan solo 3 unidades"


# ------------------------------------------------------------------ recomendaciones
def test_recommendations_use_history_budget_and_exclude_owned():
    perfil = cat.perfil_compras([PEDIDO], {p["id"]: p for p in PRODUCTOS})
    assert perfil["ids_comprados"] == {1} and perfil["categorias"]["Laptops"] == 1
    recs = cat.recomendar(PRODUCTOS, perfil, {"presupuesto": "hasta 3,000 soles", "uso_principal": "gaming"})
    got = [p["id"] for p, _ in recs]
    assert 1 not in got and 3 not in got and 7 not in got      # ya comprado / fuera de presupuesto
    assert got[0] == 2 and "ya compraste en Laptops" in recs[0][1]
    assert 5 in got                                            # el mouse gamer encaja con "gaming"


def test_new_customer_gets_variety_not_one_category():
    perfil = cat.perfil_compras([], {})
    recs = cat.recomendar(PRODUCTOS, perfil, {}, limite=4)
    assert len({p["categoriaNombre"] for p, _ in recs}) == len(recs)


def test_budget_parsing():
    assert cat.presupuesto_de("hasta 3,000 soles") == 3000 and cat.presupuesto_de("unos S/ 1500.50") == 1500.5
    assert cat.presupuesto_de("barato") is None


# ------------------------------------------------------------------ motor + proyecto
async def test_system_prompt_has_personal_context_but_no_personal_data(settings):
    eng, proj, llm = _engine(settings)
    await eng.chat(principal("ana@correo.com", "USER"), "hola")
    s = llm.calls[0]["system"]
    assert "Ana Pérez" in s and "1 pedido(s)" in s and "MT-0010" in s and "Laptop Lenovo LOQ" in s
    for secreto in ("12345678", "987654321", "Av. Secreta", "ana@correo.com"):
        assert secreto not in s                                 # DNI, telefono, direccion y correo no van al modelo
    assert "Eres el asistente virtual de Master Tech" in s


async def test_search_tool_returns_cards_and_hides_ui_from_model(settings):
    eng, proj, llm = _engine(settings, [
        LLMResponse(tool_calls=[ToolCall("buscar_productos", {"texto": "laptop gamer", "limite": 4.0})]),
        LLMResponse(text="Te sirve la Lenovo."),
    ])
    r = await eng.chat(principal("ana@correo.com", "USER"), "una laptop para jugar")
    assert r.ui_actions == [{"type": "products", "ids": [1, 7]}] or r.ui_actions == [{"type": "products", "ids": [7, 1]}]
    visto = llm.calls[1]["messages"][-1]["result"]
    assert "_ui" not in visto and visto["total_coincidencias"] == 2


async def test_no_results_reports_sold_out_items(settings):
    eng, proj, llm = _engine(settings, [LLMResponse(tool_calls=[ToolCall("buscar_productos", {"texto": "samsung galaxy"})]), LLMResponse(text="x")])
    r = await eng.chat(principal("ana@correo.com", "USER"), "galaxy")
    res = llm.calls[1]["messages"][-1]["result"]
    assert res["productos"] == [] and res["agotados_por_ahora"] == ["Samsung Galaxy A55"] and r.ui_actions == []


async def test_detail_compare_categories_and_purchases(settings):
    eng, proj, llm = _engine(settings, [
        LLMResponse(tool_calls=[ToolCall("detalle_producto", {"producto_id": 1}), ToolCall("detalle_producto", {"producto_id": 99}),
                                ToolCall("comparar_productos", {"ids": "1, 2"}), ToolCall("comparar_productos", {"ids": "1"}),
                                ToolCall("listar_categorias", {}), ToolCall("mis_compras", {})]),
        LLMResponse(text="ok"),
    ])
    r = await eng.chat(principal("ana@correo.com", "USER"), "info")
    res = [m["result"] for m in llm.calls[1]["messages"] if m["role"] == "tool"]
    assert res[0]["especificaciones"] == [{"nombre": "RAM", "valor": "16 GB"}]
    assert "No encontré" in res[1]["error"] and "entre 2 y 3" in res[3]["error"]
    assert [p["id"] for p in res[2]["productos"]] == [1, 2]
    assert {c["nombre"]: c["productos_con_stock"] for c in res[4]["categorias"]}["Teléfonos"] == 1
    assert res[5]["pedidos"][0]["numero_orden"] == "MT-0010" and res[5]["pedidos"][0]["items"][0]["producto_id"] == 1
    assert [u["ids"] for u in r.ui_actions] == [[1], [1, 2]]


async def test_recommendation_tool_reads_saved_facts_and_scopes_history_to_the_user(settings):
    api = FakeApi(pedidos={"tok": [PEDIDO], "otro": []}, perfiles={"tok": {"nombre": "Ana"}, "otro": {"nombre": "Beto"}})
    eng, proj, llm = _engine(settings, [
        LLMResponse(tool_calls=[ToolCall("recordar_dato", {"clave": "presupuesto", "valor": "hasta 3000 soles"})]),
        LLMResponse(text="anotado"),
        LLMResponse(tool_calls=[ToolCall("recomendaciones_para_mi", {})]),
        LLMResponse(text="mira"),
    ])
    p = principal("ana@correo.com", "USER")
    await eng.chat(p, "mi presupuesto es hasta 3000 soles")
    r = await eng.chat(p, "recomiéndame")
    res = llm.calls[3]["messages"][-1]["result"]
    got = [x["id"] for x in res["productos"]]
    assert 1 not in got and 7 not in got and all(x["precio"] <= 3000 for x in res["productos"])
    assert r.ui_actions[0]["ids"] == got
    assert "presupuesto: hasta 3000 soles" in llm.calls[2]["system"]       # memoria entre mensajes
    # otro cliente (otro token) no hereda ni historial ni preferencias
    from bot_core.auth import Principal
    await eng.chat(Principal("beto@correo.com", "USER", "", "otro"), "hola")
    s = llm.calls[-1]["system"] if len(llm.calls) > 4 else ""
    assert "MT-0010" not in s and "hasta 3000" not in s


async def test_context_survives_spring_down(settings):
    class Caida(FakeApi):
        async def perfil(self, token): raise RuntimeError("down")
        async def pedidos(self, token): raise RuntimeError("down")
    eng, proj, llm = _engine(settings, api=Caida())
    r = await eng.chat(principal("ana@correo.com", "USER"), "hola")
    assert r.text == "ok" and "Compras:" not in llm.calls[0]["system"]


# ------------------------------------------------------------------ historial entre sesiones
async def test_conversation_is_resumed_and_history_restores_cards(settings):
    eng, proj, llm = _engine(settings, [
        LLMResponse(tool_calls=[ToolCall("buscar_productos", {"texto": "mouse"})]), LLMResponse(text="Este mouse"),
    ])
    p = principal("ana@correo.com", "USER")
    r1 = await eng.chat(p, "un mouse", resume=True)
    r2 = await eng.chat(p, "gracias", resume=True)                        # "otra sesion": sin conversation_id
    assert r2.conversation_id == r1.conversation_id
    assert [m["text"] for m in llm.calls[-1]["messages"]] == ["un mouse", "Este mouse", "gracias"]   # el modelo recuerda
    h = await eng.history(p)
    assert h["conversation_id"] == r1.conversation_id
    assert [m["role"] for m in h["messages"]] == ["user", "assistant", "user", "assistant"]
    assert h["messages"][1]["ui"] == [{"type": "products", "ids": [5]}]    # las tarjetas se repintan
    r3 = await eng.chat(p, "nueva", resume=False)                         # "Nueva conversación"
    assert r3.conversation_id != r1.conversation_id
    assert (await eng.history(p))["conversation_id"] == r3.conversation_id


async def test_history_of_other_user_is_empty_and_expired_conversations_are_not_resumed(settings):
    eng, proj, llm = _engine(settings)
    await eng.chat(principal("ana@correo.com", "USER"), "hola", resume=True)
    assert (await eng.history(principal("beto@correo.com", "USER")))["messages"] == []
    primera = (await eng.history(principal("ana@correo.com", "USER")))["conversation_id"]
    settings.resume_days = 0                                               # todo se considera vencido
    r = await eng.chat(principal("ana@correo.com", "USER"), "hola otra vez", resume=True)
    assert r.conversation_id != primera


# ------------------------------------------------------------------ esquemas validos para Gemini
def test_mastertech_tool_schemas_are_valid_for_gemini():
    pytest.importorskip("google.genai")
    from google.genai import types
    from bot_core.llm import _to_gemini_schema
    from projects.mastertech.project import MastertechProject
    p = MastertechProject(FakeApi(), FakeSpecs())
    nombres = {t.name for t in p.registry.for_role("USER")}
    assert {"buscar_productos", "detalle_producto", "comparar_productos", "listar_categorias", "mis_compras",
            "recomendaciones_para_mi", "recordar_dato", "olvidar_dato"} <= nombres
    for t in p.registry.for_role("USER"):
        _to_gemini_schema(types, t.schema)
    s = p.registry.get("buscar_productos").schema
    assert s["required"] == [] and s["properties"]["orden"]["enum"] == ["relevancia", "precio_asc", "precio_desc"]
    assert all(not t.confirm for t in p.registry.for_role("USER"))        # el bot no ejecuta acciones con efectos


# ------------------------------------------------------------------ cliente HTTP (httpx simulado)
def _backend(handler):
    httpx = pytest.importorskip("httpx")
    from projects.mastertech.backend import MastertechBackend
    api = MastertechBackend("http://spring")
    api.http = httpx.AsyncClient(base_url="http://spring", transport=httpx.MockTransport(handler))
    return api, httpx


async def test_backend_caches_catalog_and_forwards_token_only_for_user_data():
    seen = []
    def handler(req):
        seen.append((req.url.path, req.headers.get("authorization")))
        import httpx
        return httpx.Response(200, json=PRODUCTOS if req.url.path.endswith("productos") else [PEDIDO])
    api, _ = _backend(handler)
    await api.catalogo(); await api.catalogo()
    assert seen == [("/api/v1/productos", None)]                           # publico: sin token y una sola llamada
    assert (await api.pedidos("tok"))[0]["numeroOrden"] == "MT-0010"
    assert seen[-1] == ("/api/v1/me/pedidos", "Bearer tok")


async def test_backend_serves_stale_catalog_when_spring_is_down_and_maps_errors():
    from bot_core.tools import ToolError
    estado = {"ok": True}
    def handler(req):
        import httpx
        if not estado["ok"]:
            raise httpx.ConnectError("down")
        if req.url.path.endswith("/me"):
            return httpx.Response(401)
        return httpx.Response(200, json=PRODUCTOS)
    api, _ = _backend(handler)
    api.catalog_ttl = api.user_ttl = 0.0                                   # cada lectura expira
    assert len(await api.catalogo()) == 7
    estado["ok"] = False
    assert len(await api.catalogo()) == 7                                  # usa el dato viejo
    with pytest.raises(ToolError, match="no responde"):
        await api.categorias()                                             # sin dato previo: error claro
    estado["ok"] = True
    await api.pedidos("tok")                                               # llena la cache privada del cliente
    estado["ok"] = False
    with pytest.raises(ToolError, match="no responde"):
        await api.pedidos("tok")                                           # datos de cliente: NUNCA se sirven viejos
    estado["ok"] = True
    with pytest.raises(ToolError, match="sesión expiró"):
        await api.perfil("tok")


async def test_specs_reader_degrades_gracefully():
    from projects.mastertech.specs import SpecsReader
    s = SpecsReader()
    assert await s.para([1]) == {}                                         # sin pool
    class Pool:
        def connection(self): raise RuntimeError("tabla inexistente")
    s.pool = Pool()
    assert await s.para([1]) == {}


# ------------------------------------------------------------------ API HTTP
def test_api_history_and_new_conversation(settings):
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    from bot_core.api import create_app
    from projects.mastertech.project import MastertechProject
    from conftest import make_token
    settings.jwt_issuer = ""
    store = InMemoryStore()
    c = TestClient(create_app(settings, MastertechProject(FakeApi(), FakeSpecs()), store, FakeLLM()))
    tok = jwt.encode({"sub": "ana@correo.com", "rol": "USER", "exp": int(time.time()) + 600}, SECRET, algorithm="HS256")
    h = {"Authorization": f"Bearer {tok}"}
    assert c.get("/history").status_code == 401
    assert c.get("/history", headers=h).json() == {"conversation_id": None, "messages": []}
    a = c.post("/chat", json={"message": "hola"}, headers=h).json()
    b = c.post("/chat", json={"message": "sigo aquí"}, headers=h).json()
    assert a["conversation_id"] == b["conversation_id"]                    # retoma la ultima sin que el front la envie
    n = c.post("/chat", json={"message": "otra", "new": True}, headers=h).json()
    assert n["conversation_id"] != a["conversation_id"]
    hist = c.get("/history", headers=h).json()
    assert hist["conversation_id"] == n["conversation_id"] and len(hist["messages"]) == 2


# ------------------------------------------------------------------ borrar datos y tiempo maximo
async def test_forget_removes_user_row_and_ids_are_not_reused(settings):
    eng, proj, llm = _engine(settings)
    a, b = principal("a@x.com", "USER"), principal("b@x.com", "USER")
    await eng.chat(a, "hola"); await eng.chat(b, "hola")
    await eng.forget(a)
    assert ("mastertech", "a@x.com") not in eng.store.users                # el correo ya no queda en bot.users
    assert ("mastertech", "b@x.com") in eng.store.users
    await eng.chat(a, "volví")
    assert eng.store.users[("mastertech", "a@x.com")] != eng.store.users[("mastertech", "b@x.com")]


async def test_chat_budget_returns_friendly_message(settings):
    import asyncio

    class Lento(FakeLLM):
        async def generate(self, **kw):
            await asyncio.sleep(1)
            return LLMResponse(text="tarde")
    settings.chat_budget_s = 0.05
    eng, proj, _ = _engine(settings)
    eng.llm = Lento()
    r = await eng.chat(principal("a@x.com", "USER"), "hola")
    assert "demorando" in r.text


async def test_older_summary_never_overwrites_a_newer_one(settings):
    eng, proj, llm = _engine(settings)
    r = await eng.chat(principal("a@x.com", "USER"), "hola")
    await eng.store.set_summary(r.conversation_id, "nuevo", 10)
    await eng.store.set_summary(r.conversation_id, "viejo", 5)           # termino tarde: se descarta
    conv = await eng.store.get_conversation(r.conversation_id)
    assert (conv.summary, conv.summarized_upto) == ("nuevo", 10)


async def test_concurrent_summaries_run_one_at_a_time(settings):
    import asyncio
    settings.history_messages = 2
    eng, proj, llm = _engine(settings)
    activos, maximo = 0, 0

    async def lento(*, system, prompt):
        nonlocal activos, maximo
        activos += 1; maximo = max(maximo, activos)
        await asyncio.sleep(0.02)
        activos -= 1
        return "resumen"
    llm.complete = lento
    p = principal("a@x.com", "USER")
    r = await eng.chat(p, "uno")
    for i in range(8):
        await eng.store.add_message(r.conversation_id, "user" if i % 2 == 0 else "assistant", f"m{i}")
    await asyncio.gather(*(eng._maybe_summarize(r.conversation_id) for _ in range(4)))
    assert maximo == 1 and not eng._sum_locks
