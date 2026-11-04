"""Cliente HTTP hacia la API Spring de Master Tech.

* Catalogo y categorias: endpoints publicos, con cache corto (la tienda tiene pocos productos y Render
  duerme el servicio gratuito: asi el bot no depende de que Spring responda en cada mensaje).
* Datos del cliente (/api/v1/me, /api/v1/me/pedidos): se reenvia el JWT del usuario; Spring decide que ve.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx
from bot_core.tools import ToolError

log = logging.getLogger("projects.mastertech.backend")


class MastertechBackend:
    def __init__(self, base_url: str, timeout: float = 15.0, catalog_ttl: float = 45.0, user_ttl: float = 20.0):
        self.http = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=timeout)
        self.catalog_ttl, self.user_ttl = catalog_ttl, user_ttl
        self._cache: dict[tuple, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

    async def aclose(self) -> None:
        await self.http.aclose()

    # ------------------------------------------------------------------ HTTP
    async def _req(self, path: str, token: str | None = None) -> Any:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        try:
            r = await self.http.get(path, headers=headers)
        except httpx.HTTPError as e:
            raise ToolError("La tienda no responde ahora mismo. Inténtalo en un momento.") from e
        if r.status_code in (401, 403):
            raise ToolError("Tu sesión expiró. Inicia sesión de nuevo.")
        if r.status_code >= 400:
            msg = ""
            try:
                body = r.json()
                msg = body.get("message") or body.get("error") or ""
            except Exception:                       # noqa: BLE001
                pass
            raise ToolError(msg or "La tienda rechazó la consulta.")
        return r.json() if r.content else None

    async def _cached(self, key: tuple, ttl: float, path: str, token: str | None = None) -> Any:
        """Cache con TTL. Si Spring falla y hay un dato viejo, se usa ese antes que dejar al bot sin catalogo."""
        hit = self._cache.get(key)
        if hit and time.monotonic() - hit[0] < ttl:
            return hit[1]
        # el catalogo es compartido: un solo viaje a Spring aunque lleguen varios mensajes a la vez
        lock = self._lock if len(key) == 1 else None
        if lock:
            await lock.acquire()
        try:
            hit = self._cache.get(key)
            if hit and time.monotonic() - hit[0] < ttl:
                return hit[1]
            try:
                data = await self._req(path, token)
            except ToolError:
                # Solo el catalogo publico (sin token) puede servirse viejo. Los datos de un cliente nunca:
                # si Spring rechaza su sesion o cambian sus permisos, no se reutiliza lo que habia en cache.
                if hit and token is None:
                    log.warning("Spring no responde; se usa el dato en cache de %s", path)
                    return hit[1]
                raise
            if len(self._cache) > 500:              # evita crecer sin limite (una entrada por token)
                self._cache = {k: v for k, v in self._cache.items() if time.monotonic() - v[0] < 60}
            self._cache[key] = (time.monotonic(), data)
            return data
        finally:
            if lock:
                lock.release()

    # ------------------------------------------------------------------ catalogo (publico)
    async def catalogo(self) -> list[dict]:
        return await self._cached(("catalogo",), self.catalog_ttl, "/api/v1/productos") or []

    async def categorias(self) -> list[dict]:
        return await self._cached(("categorias",), self.catalog_ttl, "/api/v1/categorias") or []

    # ------------------------------------------------------------------ cliente (con su JWT)
    async def perfil(self, token: str) -> dict:
        return await self._cached(("perfil", token), self.user_ttl, "/api/v1/me", token) or {}

    async def pedidos(self, token: str) -> list[dict]:
        return await self._cached(("pedidos", token), self.user_ttl, "/api/v1/me/pedidos", token) or []
