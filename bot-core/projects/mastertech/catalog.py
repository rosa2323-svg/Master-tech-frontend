"""Logica pura (sin red ni BD) del catalogo de Master Tech: busqueda, fichas y perfil de compras.

Los productos son los dicts que devuelve Spring (ProductoDTO):
  id, nombre, descripcion, precio, marca, imagenUrl, stock, categoriaId, categoriaNombre
"""
from __future__ import annotations

import re
import unicodedata
from collections import Counter
from datetime import datetime
from typing import Any, Iterable


def norm(texto: Any) -> str:
    """Minusculas y sin tildes: 'Teléfonos' -> 'telefonos'."""
    s = unicodedata.normalize("NFD", str(texto or "").lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn").strip()


def soles(n: Any) -> str:
    try:
        return f"S/ {float(n):,.2f}"
    except (TypeError, ValueError):
        return "S/ -"


def fecha_corta(iso: Any) -> str:
    try:
        return datetime.fromisoformat(str(iso)[:19]).strftime("%d/%m/%Y")
    except ValueError:
        return ""


# ----------------------------------------------------------------------------- busqueda
_RELLENO = {
    "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "para", "con", "sin", "y", "o", "u", "que",
    "quiero", "busco", "necesito", "algo", "mas", "por", "en", "a", "al", "me", "mi", "mis", "tienen", "tiene",
    "hay", "comprar", "ver", "mostrar", "muestrame", "dame", "recomienda", "recomiendame", "favor", "porfa", "hola",
}
# cada grupo es intercambiable entre si ("celular" encuentra productos de categoria "Teléfonos")
_SINONIMOS = [
    {"celular", "telefono", "smartphone", "movil", "iphone"},
    {"laptop", "notebook", "portatil", "computadora", "pc"},
    {"audifono", "auricular", "headset", "casco"},
    {"consola", "playstation", "ps5", "nintendo", "xbox"},
    {"gamer", "gaming", "juegos", "gamers"},
    {"monitor", "pantalla"},
    {"tarjeta de video", "gpu", "grafica", "rtx"},
]


def _raiz(t: str) -> str:
    if len(t) > 4 and t.endswith("es"):
        return t[:-2]
    if len(t) > 3 and t.endswith("s"):
        return t[:-1]
    return t


def grupos_de_busqueda(texto: str) -> list[set[str]]:
    """Cada palabra util -> conjunto de alternativas (su raiz + sinonimos)."""
    out: list[set[str]] = []
    for w in re.findall(r"[a-z0-9]+", norm(texto)):
        if w in _RELLENO or (len(w) < 2):
            continue
        r = _raiz(w)
        alts = {w, r}
        for g in _SINONIMOS:
            if w in g or r in g:
                alts |= {_raiz(x) for x in g}
        out.append(alts)
    return out


def _pajar(p: dict) -> tuple[str, str, str]:
    cab = norm(f"{p.get('nombre', '')} {p.get('marca', '')}")
    cat = norm(p.get("categoriaNombre"))
    desc = norm(p.get("descripcion"))
    return cab, cat, desc


def puntaje(p: dict, grupos: list[set[str]]) -> int:
    """0 si no coincide con TODAS las palabras utiles; si no, mayor = mas relevante."""
    if not grupos:
        return 1
    cab, cat, desc = _pajar(p)
    total = 0
    for alts in grupos:
        s = 0
        for a in alts:
            if a in cab:
                s = max(s, 3)
            elif a in cat:
                s = max(s, 2)
            elif a in desc:
                s = max(s, 1)
        if s == 0:
            return 0
        total += s
    return total


def buscar(productos: Iterable[dict], texto: str | None = None, categoria: str | None = None,
           marca: str | None = None, precio_min: float | None = None, precio_max: float | None = None,
           solo_con_stock: bool = True, orden: str = "relevancia", limite: int = 5) -> tuple[list[dict], int]:
    """Devuelve (primeros `limite` resultados, total de coincidencias)."""
    grupos = grupos_de_busqueda(texto or "")
    g_cat = grupos_de_busqueda(categoria or "")
    m = norm(marca)
    hits: list[tuple[int, dict]] = []
    for p in productos:
        if solo_con_stock and (p.get("stock") or 0) <= 0:
            continue
        precio = float(p.get("precio") or 0)
        if precio_min is not None and precio < precio_min:
            continue
        if precio_max is not None and precio > precio_max:
            continue
        if m and m not in norm(p.get("marca")):
            continue
        if g_cat:
            cat = norm(p.get("categoriaNombre"))
            if not all(any(a in cat for a in alts) for alts in g_cat):
                continue
        sc = puntaje(p, grupos)
        if sc:
            hits.append((sc, p))
    if orden == "precio_asc":
        hits.sort(key=lambda h: (float(h[1].get("precio") or 0), -h[0]))
    elif orden == "precio_desc":
        hits.sort(key=lambda h: (-float(h[1].get("precio") or 0), -h[0]))
    else:
        hits.sort(key=lambda h: (-h[0], -(h[1].get("stock") or 0), h[1].get("id") or 0))
    return [p for _, p in hits[: max(1, limite)]], len(hits)


def ficha(p: dict, largo: bool = False) -> dict:
    desc = " ".join(str(p.get("descripcion") or "").split())
    d = {
        "id": p.get("id"), "nombre": p.get("nombre"), "marca": p.get("marca") or "Sin marca",
        "categoria": p.get("categoriaNombre"), "precio": float(p.get("precio") or 0), "precio_texto": soles(p.get("precio")),
        "stock": p.get("stock") or 0, "disponible": (p.get("stock") or 0) > 0,
        "descripcion": desc if largo else desc[:160],
    }
    if 0 < d["stock"] <= 5:
        d["aviso"] = f"quedan solo {d['stock']} unidades"
    return d


# ----------------------------------------------------------------------------- perfil de compras
def perfil_compras(pedidos: list[dict], catalogo: dict[int, dict]) -> dict:
    """Resume el historial del cliente. `pedidos` = VentaDTO de /api/v1/me/pedidos."""
    cats: Counter[str] = Counter()
    marcas: Counter[str] = Counter()
    ids: set[int] = set()
    ultimas: list[dict] = []
    total = 0.0
    for v in sorted(pedidos, key=lambda x: str(x.get("fecha") or ""), reverse=True):
        total += float(v.get("total") or 0)
        for d in v.get("detalles") or []:
            pid = d.get("productoId")
            cant = int(d.get("cantidad") or 1)
            prod = catalogo.get(pid) or {}
            if pid is not None:
                ids.add(pid)
            if prod.get("categoriaNombre"):
                cats[prod["categoriaNombre"]] += cant
            if prod.get("marca"):
                marcas[prod["marca"]] += cant
            if len(ultimas) < 6:
                ultimas.append({"producto": d.get("productoNombre") or prod.get("nombre") or "producto",
                                "cantidad": cant, "fecha": fecha_corta(v.get("fecha")), "id": pid})
    ordenados = sorted(pedidos, key=lambda x: str(x.get("fecha") or ""), reverse=True)
    return {
        "n_pedidos": len(pedidos), "total_gastado": total,
        "ultima_fecha": fecha_corta(ordenados[0].get("fecha")) if ordenados else "",
        "ultimo_pedido": ordenados[0].get("numeroOrden") if ordenados else None,
        "categorias": cats, "marcas": marcas, "ids_comprados": ids, "ultimas": ultimas,
    }


def texto_contexto(nombre: str | None, desde: str | None, perfil: dict) -> str:
    lineas = []
    if nombre:
        lineas.append(f"Nombre del cliente: {nombre} (salúdalo por su primer nombre; no asumas su género).")
    if desde:
        lineas.append(f"Cliente desde: {fecha_corta(desde)}.")
    if perfil["n_pedidos"]:
        lineas.append(f"Compras: {perfil['n_pedidos']} pedido(s), total {soles(perfil['total_gastado'])}. "
                      f"Último pedido: {perfil['ultima_fecha']} (orden {perfil['ultimo_pedido']}).")
        lineas.append("Productos comprados recientemente: " + "; ".join(
            f"{u['producto']} x{u['cantidad']} ({u['fecha']})" for u in perfil["ultimas"]))
        if perfil["categorias"]:
            lineas.append("Categorías que más compra: " + ", ".join(f"{k} ({v})" for k, v in perfil["categorias"].most_common(3)))
        if perfil["marcas"]:
            lineas.append("Marcas que más compra: " + ", ".join(f"{k} ({v})" for k, v in perfil["marcas"].most_common(3)))
    else:
        lineas.append("Aún no ha realizado compras en la tienda (cliente nuevo).")
    return "\n".join(lineas)


# ----------------------------------------------------------------------------- recomendaciones
def presupuesto_de(texto: str | None) -> float | None:
    """'hasta 3,000 soles' -> 3000. Toma el numero mas alto que aparezca."""
    nums = [float(n.replace(",", "")) for n in re.findall(r"\d[\d,]*(?:\.\d+)?", texto or "")]
    nums = [n for n in nums if n >= 20]
    return max(nums) if nums else None


def recomendar(productos: Iterable[dict], perfil: dict, hechos: dict[str, str],
               presupuesto_max: float | None = None, limite: int = 4) -> list[tuple[dict, list[str]]]:
    """Ordena el catalogo con stock por afinidad con el cliente. Devuelve (producto, motivos)."""
    tope = presupuesto_max or presupuesto_de(hechos.get("presupuesto"))
    interes = norm(hechos.get("categoria_interes"))
    marca_fav = norm(hechos.get("marca_favorita"))
    uso: set[str] = set()
    for w in re.findall(r"[a-z0-9]+", norm(hechos.get("uso_principal"))):
        if w not in _RELLENO and len(w) > 3:
            uso |= _alts(w)
    cats_compradas = {norm(k): k for k in perfil["categorias"]}
    marcas_compradas = {norm(k): k for k in perfil["marcas"]}

    puntuados: list[tuple[int, dict, list[str]]] = []
    for p in productos:
        if (p.get("stock") or 0) <= 0 or p.get("id") in perfil["ids_comprados"]:
            continue
        if tope and float(p.get("precio") or 0) > tope:
            continue
        cat, marca = norm(p.get("categoriaNombre")), norm(p.get("marca"))
        cab, _, desc = _pajar(p)
        sc, motivos = 0, []
        if cat in cats_compradas:
            sc += 2 + min(perfil["categorias"][cats_compradas[cat]], 3)
            motivos.append(f"ya compraste en {p.get('categoriaNombre')}")
        if marca and marca in marcas_compradas:
            sc += 3
            motivos.append(f"compraste antes la marca {p.get('marca')}")
        if interes and (interes in cat or any(a in cat for a in _alts(interes))):
            sc += 4
            motivos.append(f"te interesa {hechos.get('categoria_interes')}")
        if marca_fav and marca and (marca_fav in marca or marca in marca_fav):
            sc += 4
            motivos.append(f"tu marca favorita: {p.get('marca')}")
        if any(u in cab or u in desc for u in uso):
            sc += 2
            motivos.append(f"va con tu uso ({hechos.get('uso_principal')})")
        if tope and sc:
            motivos.append(f"dentro de tu presupuesto (hasta {soles(tope)})")
        puntuados.append((sc, p, motivos))
    puntuados.sort(key=lambda t: (-t[0], -(t[1].get("stock") or 0), t[1].get("id") or 0))
    if puntuados and puntuados[0][0] == 0:
        # cliente sin señales: variedad (uno por categoria) en vez de lo primero que haya
        vistos: set[str] = set()
        variados = []
        for sc, p, m in puntuados:
            if p.get("categoriaNombre") not in vistos:
                vistos.add(p.get("categoriaNombre"))
                variados.append((sc, p, ["destacado de la tienda"]))
        puntuados = variados
    return [(p, m) for _, p, m in puntuados[: max(1, limite)]]


def _alts(w: str) -> set[str]:
    alts = {w, _raiz(w)}
    for g in _SINONIMOS:
        if w in g or _raiz(w) in g:
            alts |= {_raiz(x) for x in g}
    return alts
