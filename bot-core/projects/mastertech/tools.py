"""Herramientas del asistente de Master Tech.

Todas son de LECTURA: el bot orienta y muestra productos, pero no agrega al carrito ni cobra. El cliente
pulsa "Agregar" en la tarjeta y paga en la web (Stripe). Las tarjetas se piden con `_ui`: el motor no se
las pasa al modelo, solo al frontend.
"""
from __future__ import annotations

from typing import Annotated, Literal, Optional

from bot_core.tools import ToolContext, ToolError, ToolRegistry

from . import catalog as cat

Orden = Literal["relevancia", "precio_asc", "precio_desc"]
IdsProductos = Annotated[str, "ids de 2 a 3 productos separados por coma, por ejemplo: 12,15"]
Texto = Annotated[str, "palabras del producto, sin precios (ej: laptop gamer, iphone 15, mouse inalámbrico)"]
Categoria = Annotated[str, "categoría de la tienda (ej: laptops, teléfonos, consolas, accesorios, componentes)"]
Soles = Annotated[float, "monto en soles (S/)"]


def _tarjetas(productos: list[dict]) -> dict:
    return {"type": "products", "ids": [p["id"] for p in productos]}


def register(reg: ToolRegistry, api, specs) -> None:
    async def por_id() -> dict[int, dict]:
        return {p["id"]: p for p in await api.catalogo()}

    # ----------------------------------------------------------------- catalogo
    @reg.tool("Busca en el catálogo real de la tienda (con stock y precios actuales). Todos los filtros son opcionales. "
              "'texto' son palabras del producto (laptop gamer, iphone, mouse). Por defecto solo muestra lo que tiene stock. "
              "Si la app muestra tarjetas con foto y botón Agregar, no repitas toda la ficha en tu texto.")
    async def buscar_productos(ctx: ToolContext, texto: Optional[Texto] = None, categoria: Optional[Categoria] = None,
                               marca: Optional[str] = None, precio_min: Optional[Soles] = None,
                               precio_max: Optional[Soles] = None, orden: Orden = "relevancia",
                               limite: int = 4, mostrar_tarjetas: bool = True) -> dict:
        productos = await api.catalogo()
        limite = max(1, min(int(limite), 6))
        hallados, total = cat.buscar(productos, texto, categoria, marca, precio_min, precio_max, True, orden, limite)
        if not hallados:
            agotados, _ = cat.buscar(productos, texto, categoria, marca, precio_min, precio_max, False, orden, 3)
            out: dict = {"total_coincidencias": 0, "productos": [],
                         "sugerencia": "No hay coincidencias con stock. Prueba otras palabras, relaja el precio/marca o consulta listar_categorias."}
            if agotados:
                out["agotados_por_ahora"] = [a["nombre"] for a in agotados]
            return out
        out = {"total_coincidencias": total, "mostrando": len(hallados), "productos": [cat.ficha(p) for p in hallados]}
        if mostrar_tarjetas:
            out["_ui"] = _tarjetas(hallados)
        return out

    @reg.tool("Ficha completa de UN producto (descripción completa, stock y especificaciones técnicas si existen). "
              "Usa el id que devolvió buscar_productos.")
    async def detalle_producto(ctx: ToolContext, producto_id: int) -> dict:
        p = (await por_id()).get(producto_id)
        if p is None:
            raise ToolError("No encontré ese producto en el catálogo.")
        esp = (await specs.para([producto_id])).get(producto_id, [])
        out = {"producto": cat.ficha(p, largo=True), "especificaciones": esp, "_ui": _tarjetas([p])}
        if not esp:
            out["nota"] = "No hay especificaciones técnicas cargadas; limítate a la descripción."
        return out

    @reg.tool("Compara 2 o 3 productos lado a lado (precio, stock, descripción y especificaciones).")
    async def comparar_productos(ctx: ToolContext, ids: IdsProductos) -> dict:
        try:
            pedidos = list(dict.fromkeys(int(x) for x in str(ids).replace(";", ",").split(",") if x.strip()))
        except ValueError:
            raise ToolError("ids inválidos: usa números separados por coma")
        if not 2 <= len(pedidos) <= 3:
            raise ToolError("Indica entre 2 y 3 productos para comparar.")
        mapa = await por_id()
        faltan = [i for i in pedidos if i not in mapa]
        if faltan:
            raise ToolError(f"No encontré los productos: {', '.join(map(str, faltan))}")
        esp = await specs.para(pedidos)
        productos = [mapa[i] for i in pedidos]
        return {"productos": [{**cat.ficha(p, largo=True), "especificaciones": esp.get(p["id"], [])} for p in productos],
                "_ui": _tarjetas(productos)}

    @reg.tool("Lista las categorías de la tienda con cuántos productos tienen en stock.")
    async def listar_categorias(ctx: ToolContext) -> dict:
        productos = await api.catalogo()
        cuenta: dict[str, int] = {}
        for p in productos:
            if (p.get("stock") or 0) > 0:
                cuenta[p.get("categoriaNombre") or "Otros"] = cuenta.get(p.get("categoriaNombre") or "Otros", 0) + 1
        cats = await api.categorias()
        return {"categorias": [{"nombre": c["nombre"], "descripcion": c.get("descripcion"),
                                "productos_con_stock": cuenta.get(c["nombre"], 0)} for c in cats]}

    # ----------------------------------------------------------------- el cliente
    @reg.tool("Historial de compras del cliente en sesión (más recientes primero): número de orden, fecha, total y productos.")
    async def mis_compras(ctx: ToolContext, limite: int = 5) -> dict:
        pedidos = await api.pedidos(ctx.token)
        pedidos = sorted(pedidos, key=lambda v: str(v.get("fecha") or ""), reverse=True)[: max(1, min(int(limite), 10))]
        return {
            "pedidos": [{
                "numero_orden": v.get("numeroOrden"), "fecha": cat.fecha_corta(v.get("fecha")),
                "total": cat.soles(v.get("total")), "estado": v.get("estado") or "Pagado",
                "items": [{"producto_id": d.get("productoId"), "producto": d.get("productoNombre"),
                           "cantidad": d.get("cantidad"), "precio_unitario": cat.soles(d.get("precioUnitario"))}
                          for d in v.get("detalles") or []],
            } for v in pedidos],
            "nota": "La tienda no registra el seguimiento del envío; para eso, soporte@mastertech.pe." if pedidos else
                    "El cliente aún no tiene compras.",
        }

    @reg.tool("Recomienda productos con stock según lo que el cliente ya compró y sus preferencias guardadas "
              "(categoría, marca, uso, presupuesto). Úsala cuando pida recomendaciones o no sepa qué elegir. "
              "Devuelve los motivos de cada recomendación para que los expliques.")
    async def recomendaciones_para_mi(ctx: ToolContext, presupuesto_max: Optional[Soles] = None, limite: int = 4) -> dict:
        productos = await api.catalogo()
        mapa = {p["id"]: p for p in productos}
        perfil = cat.perfil_compras(await api.pedidos(ctx.token), mapa)
        hechos = await ctx.store.get_facts(ctx.bot_user_id)
        recs = cat.recomendar(productos, perfil, hechos, presupuesto_max, max(1, min(int(limite), 6)))
        if not recs:
            return {"productos": [], "sugerencia": "No hay productos con stock dentro de ese presupuesto."}
        return {"productos": [{**cat.ficha(p), "motivos": m} for p, m in recs], "_ui": _tarjetas([p for p, _ in recs])}
