"""
Agrostech — Google Sheets Client (saída da fila de pitches do Motor de Prospecção Geomart)

Escreve apenas a fila diária de pitches (aba "Fila_Pitches") — não espelha o
universo inteiro de leads (a Fase 1 já mostrou dezenas de milhares de parcelas
>=500ha só em MG; jogar tudo isso numa planilha seria impraticável e inútil
para revisão humana). O histórico completo continua consultável em
geomart_leads.db (SQLite) se for preciso auditar ou exportar depois.

Setup necessário (uma vez só):
  1. Google Cloud Console -> criar projeto -> ativar "Google Sheets API".
  2. Criar uma Service Account -> gerar chave JSON.
  3. Salvar o JSON em algum caminho local e apontar GOOGLE_SHEETS_CREDENTIALS_JSON
     no runner/.env para esse caminho.
  4. Criar (ou usar) uma planilha Google Sheets, copiar o ID (parte entre /d/
     e /edit na URL) para GOOGLE_SHEETS_SPREADSHEET_ID no .env.
  5. Compartilhar essa planilha com o e-mail da service account (campo
     "client_email" dentro do JSON), com permissão de Editor.

Uso:
    from sheets_client import append_pitch_queue
    append_pitch_queue([{...}, {...}])
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

PITCH_QUEUE_SHEET = "Fila_Pitches"
PITCH_QUEUE_HEADERS = [
    "Data", "Nome do Imóvel", "Município", "UF", "Área (ha)", "Status SIGEF",
    "Link SIGEF", "Empresa Identificada", "Confiança", "Fontes OSINT",
    "Pitch Sugerido", "Status de Revisão",
    # Adicionados depois (MapBiomas) — sempre no fim, para não desalinhar linhas já escritas.
    "Cultura Provável (MapBiomas)", "% Área da Cultura",
]


def _get_client():
    import gspread
    from google.oauth2.service_account import Credentials

    creds_path = os.getenv("GOOGLE_SHEETS_CREDENTIALS_JSON", "").strip()
    if not creds_path:
        raise EnvironmentError(
            "GOOGLE_SHEETS_CREDENTIALS_JSON não configurado em runner/.env — "
            "veja o passo a passo no topo deste arquivo."
        )
    if not Path(creds_path).exists():
        raise FileNotFoundError(f"Arquivo de credenciais da service account não encontrado: {creds_path}")

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
    return gspread.authorize(creds)


def _get_spreadsheet():
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID", "").strip()
    if not spreadsheet_id:
        raise EnvironmentError("GOOGLE_SHEETS_SPREADSHEET_ID não configurado em runner/.env")
    client = _get_client()
    return client.open_by_key(spreadsheet_id)


def _ensure_worksheet(spreadsheet, title: str, headers: list[str]):
    try:
        ws = spreadsheet.worksheet(title)
    except Exception:
        ws = spreadsheet.add_worksheet(title=title, rows=1000, cols=len(headers))
        ws.append_row(headers)
        return ws

    first_row = ws.row_values(1)
    if first_row != headers:
        # Atualiza a linha 1 no lugar (nunca insert_row: isso empurraria os dados
        # já gravados uma linha pra baixo e desalinharia tudo com o header novo).
        ws.update(values=[headers], range_name="A1")
    return ws


def append_pitch_queue(entries: list[dict]) -> None:
    """
    entries: lista de dicts com chaves data, nome_area, municipio, uf, area_ha,
    status, sigef_link, empresa, confianca, fontes (list[str]), pitch.
    Cada entrada vira uma linha nova na aba Fila_Pitches, com Status de Revisão
    = "Pendente" (o vendedor edita manualmente para Aprovado/Rejeitado).
    """
    if not entries:
        return

    spreadsheet = _get_spreadsheet()
    ws = _ensure_worksheet(spreadsheet, PITCH_QUEUE_SHEET, PITCH_QUEUE_HEADERS)

    rows = []
    for e in entries:
        rows.append([
            e.get("data", ""),
            e.get("nome_area", ""),
            e.get("municipio", ""),
            e.get("uf", ""),
            e.get("area_ha", ""),
            e.get("status", ""),
            e.get("sigef_link", ""),
            e.get("empresa", ""),
            e.get("confianca", ""),
            ", ".join(e.get("fontes", [])[:3]),
            e.get("pitch", ""),
            "Pendente",
            e.get("cultura_provavel", ""),
            e.get("cultura_area_pct", ""),
        ])

    ws.append_rows(rows, value_input_option="RAW")
    logger.info(f"{len(rows)} pitch(es) escrito(s) na aba '{PITCH_QUEUE_SHEET}'.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    append_pitch_queue([{
        "data": "teste",
        "nome_area": "FAZENDA TESTE",
        "municipio": "Uberaba",
        "uf": "MG",
        "area_ha": 1000.0,
        "status": "REGISTRADA",
        "sigef_link": "https://sigef.incra.gov.br/geo/parcela/detalhe/teste",
        "empresa": "EMPRESA TESTE LTDA",
        "confianca": "alta",
        "fontes": ["https://example.com"],
        "pitch": "Pitch de teste — ignorar.",
    }])
    print("OK — linha de teste enviada para o Google Sheets.")
