"""Lectura (solo lectura) de la tabla `especificaciones` de Master Tech.

Spring no expone esa tabla, asi que el bot la lee directo de Postgres con el pool que ya tiene.
Si la tabla no existe o falla la consulta, el bot sigue funcionando sin especificaciones.
"""
from __future__ import annotations

import logging

log = logging.getLogger("projects.mastertech.specs")


class SpecsReader:
    def __init__(self) -> None:
        self.pool = None

    async def para(self, ids: list[int]) -> dict[int, list[dict]]:
        if self.pool is None or not ids:
            return {}
        try:
            async with self.pool.connection() as c:
                cur = await c.execute(
                    """select producto_id, nombre, valor from public.especificaciones
                       where producto_id = any(%s) order by producto_id, orden nulls last, id""", (list(ids),))
                rows = await cur.fetchall()
        except Exception:                           # noqa: BLE001
            log.warning("No se pudieron leer las especificaciones", exc_info=True)
            return {}
        out: dict[int, list[dict]] = {}
        for pid, nombre, valor in rows:
            out.setdefault(pid, []).append({"nombre": nombre, "valor": valor})
        return out
