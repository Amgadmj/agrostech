"""
Agrostech — Renderiza os templates HTML de marca (AvAg 2026) em PDF.

Usa Playwright/Chromium (impressão real de HTML+CSS) para preservar
fielmente o Brand Style Guide — gradientes, tipografia Montserrat/Inter,
grid — algo que geradores de PDF puramente programáticos não replicam
com a mesma fidelidade.

Uso:
    pip install playwright
    python render_pdfs.py
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent


def _find_chromium() -> str | None:
    """Locate the pre-installed Chromium binary regardless of build number."""
    root = Path(os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers"))
    for candidate in sorted(root.glob("chromium-*/chrome-linux/chrome")):
        return str(candidate)
    return None

DOCS = [
    "oferta_a_piloto_avag.html",
    "oferta_b_parceiro_avag.html",
    "termo_intencao_parceria_avag.html",
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=_find_chromium())
        page = browser.new_page()
        for name in DOCS:
            html_path = HERE / name
            pdf_path = html_path.with_suffix(".pdf")
            page.goto(html_path.as_uri())
            page.emulate_media(media="print")
            page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
            )
            print(f"OK  {pdf_path.name}")
        browser.close()


if __name__ == "__main__":
    main()
