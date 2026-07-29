"""
Agrostech — Geomart Session Auth (Playwright)

Mantém uma sessão logada no plano pago Geomart (geomart.com.br) para que
geomart_client.py consiga baixar os tiles MVT de `tiles.geomart.com.br` com
os cookies de uma sessão válida, sem repetir login a cada execução.

Login confirmado via inspeção real da página (WordPress nativo):
  GET  https://geomart.com.br/login/
  POST https://geomart.com.br/wp-login.php  (campos: log, pwd, wp-submit)
  redirect_to=https://geomart.com.br/imoveis-certificados/

O estado da sessão (cookies) é persistido em geomart_storage_state.json
(mesmo diretório deste arquivo) — nunca commitar esse arquivo (contém cookie
de sessão autenticada; já está coberto pelo padrão de .gitignore de .env).

Uso:
    from geomart_auth import get_authenticated_context
    with sync_playwright() as p:
        context = get_authenticated_context(p)
        page = context.new_page()
        page.goto("https://geomart.com.br/imoveis-certificados/")

CLI (força novo login e regrava o storage_state):
    python geomart_auth.py
"""

from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

RUNNER_DIR = Path(__file__).parent.resolve()
STORAGE_STATE_PATH = RUNNER_DIR / "geomart_storage_state.json"

LOGIN_URL = "https://geomart.com.br/login/"
CHECK_URL = "https://geomart.com.br/imoveis-certificados/"


def _login_and_save_state(playwright, email: str, senha: str) -> None:
    """Faz login real via formulário WordPress e persiste os cookies resultantes."""
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=30000)
    page.fill('input[name="log"]', email)
    page.fill('input[name="pwd"]', senha)
    with page.expect_navigation(timeout=30000):
        page.click('button[name="wp-submit"]')

    if "/login" in page.url:
        browser.close()
        raise RuntimeError(
            "Login no Geomart falhou — verifique GEOMART_EMAIL/GEOMART_SENHA no .env "
            f"(URL após submit ainda é de login: {page.url})"
        )

    context.storage_state(path=str(STORAGE_STATE_PATH))
    logger.info(f"Login Geomart OK. Sessão salva em {STORAGE_STATE_PATH}")
    browser.close()


def _session_is_valid(playwright) -> bool:
    """Testa se o storage_state salvo ainda autentica (sem ser redirecionado ao /login)."""
    if not STORAGE_STATE_PATH.exists():
        return False

    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(storage_state=str(STORAGE_STATE_PATH))
    page = context.new_page()
    try:
        page.goto(CHECK_URL, wait_until="domcontentloaded", timeout=30000)
        valid = "/login" not in page.url
    except Exception as e:
        logger.warning(f"Erro ao validar sessão Geomart salva: {e}")
        valid = False
    finally:
        browser.close()
    return valid


def get_authenticated_context(playwright, force_relogin: bool = False):
    """
    Retorna um browser.new_context() já autenticado no Geomart, reaproveitando
    geomart_storage_state.json quando ainda válido; caso contrário, faz login
    de novo com GEOMART_EMAIL/GEOMART_SENHA (.env) e regrava o estado.
    """
    email = os.getenv("GEOMART_EMAIL", "").strip()
    senha = os.getenv("GEOMART_SENHA", "").strip()
    if not email or not senha:
        raise EnvironmentError(
            "GEOMART_EMAIL/GEOMART_SENHA não configurados em runner/.env — "
            "preencha com o login do seu plano pago Geomart antes de rodar."
        )

    if force_relogin or not _session_is_valid(playwright):
        _login_and_save_state(playwright, email, senha)

    browser = playwright.chromium.launch(headless=True)
    return browser.new_context(storage_state=str(STORAGE_STATE_PATH))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        email = os.getenv("GEOMART_EMAIL", "").strip()
        senha = os.getenv("GEOMART_SENHA", "").strip()
        if not email or not senha:
            raise SystemExit(
                "Defina GEOMART_EMAIL e GEOMART_SENHA em runner/.env antes de rodar este script."
            )
        _login_and_save_state(p, email, senha)
        print(f"OK — sessão validada e salva em {STORAGE_STATE_PATH}")
