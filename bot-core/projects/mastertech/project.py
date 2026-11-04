from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

from bot_core.auth import Principal
from bot_core.config import Settings
from bot_core.project import Project

from . import catalog as cat
from .backend import MastertechBackend
from .specs import SpecsReader
from .tools import register

log = logging.getLogger("projects.mastertech")


class MastertechProject(Project):
    id = "mastertech"
    timezone = "America/Lima"
    # Lo que el bot puede recordar de cada cliente entre conversaciones (tabla bot.user_facts).
    fact_keys = {
        "uso_principal": "para qué usa o usará sus equipos: gaming, estudio, trabajo, diseño, uso diario…",
        "presupuesto": "presupuesto habitual o máximo, en soles",
        "marca_favorita": "marca que prefiere",
        "categoria_interes": "tipo de producto que más le interesa: laptops, celulares, consolas, accesorios, componentes",
        "equipo_actual": "equipo que tiene hoy y quiere reemplazar o complementar",
    }

    def __init__(self, api: MastertechBackend, specs: SpecsReader | None = None):
        super().__init__()
        self.api = api
        self.specs = specs or SpecsReader()
        register(self.registry, api, self.specs)

    def system_prompt(self) -> str:
        return Path(__file__).with_name("prompt.md").read_text(encoding="utf-8")

    async def on_startup(self, pool) -> None:
        self.specs.pool = pool

    async def load_context(self, principal: Principal) -> str:
        """Quién es el cliente y qué ha comprado, leído en vivo de Spring (nada se duplica en la BD del bot)."""
        perfil_r, pedidos_r, catalogo_r = await asyncio.gather(
            self.api.perfil(principal.token), self.api.pedidos(principal.token), self.api.catalogo(),
            return_exceptions=True)
        if isinstance(pedidos_r, Exception) and isinstance(perfil_r, Exception):
            raise pedidos_r                          # el motor lo registra y sigue sin contexto
        perfil = perfil_r if isinstance(perfil_r, dict) else {}
        catalogo = {p["id"]: p for p in catalogo_r} if isinstance(catalogo_r, list) else {}
        compras = cat.perfil_compras(pedidos_r if isinstance(pedidos_r, list) else [], catalogo)
        # solo nombre y fecha de alta: DNI, teléfono, dirección y correo no se envían al modelo
        return cat.texto_contexto(perfil.get("nombre"), perfil.get("fechaRegistro"), compras)


def build(settings: Settings):
    api = MastertechBackend(os.getenv("MASTERTECH_API_URL", "http://localhost:8089"))
    return MastertechProject(api), api.aclose
