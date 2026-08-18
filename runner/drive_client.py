"""
Agrostech — Google Drive Client (espelha a captura de eventos no Drive)

Espelha localmente runner/data/<EVENT_CODE>/<lead>/ para dentro de uma pasta
"Agrostech" no Google Drive, criando (uma vez) a subpasta do evento e, dentro
dela, uma subpasta por lead — exatamente a mesma árvore que event_capture.py
já mantém em disco. Se as credenciais não estiverem configuradas, todo o
resto do sistema continua funcionando: a captura local é a fonte da verdade,
isto aqui é só espelho.

Setup necessário (uma vez só — mesmo modelo do sheets_client.py):
  1. Google Cloud Console -> mesmo projeto do Sheets (ou outro) -> ativar
     "Google Drive API".
  2. Reusar a Service Account do sheets_client.py (ou criar uma nova) e
     garantir que o JSON de chave tem escopo de Drive.
  3. No Google Drive, compartilhar (ou criar) uma pasta chamada "Agrostech"
     com o e-mail da service account (campo "client_email" do JSON),
     permissão de Editor. A pasta "AvAg2026" é criada automaticamente
     dentro dela na primeira sincronização.
  4. No runner/.env:
       GOOGLE_DRIVE_SYNC=true
       GOOGLE_DRIVE_CREDENTIALS_JSON=<mesmo caminho do GOOGLE_SHEETS_CREDENTIALS_JSON, ou outro>
       GOOGLE_DRIVE_ROOT_FOLDER_NAME=Agrostech   (opcional — default "Agrostech")

Sem GOOGLE_DRIVE_SYNC=true, este módulo não faz nenhuma chamada de rede —
sync_enabled() retorna False e event_capture.py pula o espelhamento.

Uso:
    from drive_client import sync_enabled, sync_lead_folder
    if sync_enabled():
        sync_lead_folder("AvAg2026", lead_dir)
"""
from __future__ import annotations

import logging
import mimetypes
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive"]

_service = None
_folder_cache: dict[str, str] = {}  # "parent_id/name" -> folder_id


def sync_enabled() -> bool:
    return os.getenv("GOOGLE_DRIVE_SYNC", "").strip().lower() in ("1", "true", "yes")


def _get_service():
    global _service
    if _service is not None:
        return _service

    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    creds_path = os.getenv("GOOGLE_DRIVE_CREDENTIALS_JSON", "").strip() or os.getenv(
        "GOOGLE_SHEETS_CREDENTIALS_JSON", ""
    ).strip()
    if not creds_path:
        raise EnvironmentError(
            "GOOGLE_DRIVE_CREDENTIALS_JSON (ou GOOGLE_SHEETS_CREDENTIALS_JSON) não configurado "
            "em runner/.env — veja o passo a passo no topo deste arquivo."
        )
    if not Path(creds_path).exists():
        raise FileNotFoundError(f"Arquivo de credenciais da service account não encontrado: {creds_path}")

    creds = Credentials.from_service_account_file(creds_path, scopes=SCOPES)
    _service = build("drive", "v3", credentials=creds, cache_discovery=False)
    return _service


def _find_or_create_folder(name: str, parent_id: str | None) -> str:
    cache_key = f"{parent_id}/{name}"
    if cache_key in _folder_cache:
        return _folder_cache[cache_key]

    service = _get_service()
    q = f"name = '{name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        q += f" and '{parent_id}' in parents"
    res = service.files().list(q=q, fields="files(id, name)", spaces="drive").execute()
    files = res.get("files", [])
    if files:
        folder_id = files[0]["id"]
    else:
        metadata = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
        if parent_id:
            metadata["parents"] = [parent_id]
        folder = service.files().create(body=metadata, fields="id").execute()
        folder_id = folder["id"]
        logger.info("Pasta '%s' criada no Google Drive (id=%s).", name, folder_id)

    _folder_cache[cache_key] = folder_id
    return folder_id


def _ensure_path(names: list[str]) -> str:
    parent_id = None
    for name in names:
        parent_id = _find_or_create_folder(name, parent_id)
    return parent_id


def _upload_or_update(local_path: Path, parent_id: str) -> str:
    from googleapiclient.http import MediaFileUpload

    service = _get_service()
    mime_type = mimetypes.guess_type(local_path.name)[0] or "application/octet-stream"
    media = MediaFileUpload(str(local_path), mimetype=mime_type, resumable=False)

    q = f"name = '{local_path.name}' and trashed = false and '{parent_id}' in parents"
    res = service.files().list(q=q, fields="files(id, name)", spaces="drive").execute()
    existing = res.get("files", [])

    if existing:
        file_id = existing[0]["id"]
        service.files().update(fileId=file_id, media_body=media).execute()
    else:
        metadata = {"name": local_path.name, "parents": [parent_id]}
        created = service.files().create(body=metadata, media_body=media, fields="id").execute()
        file_id = created["id"]
    return file_id


def sync_lead_folder(event_code: str, lead_dir: Path) -> None:
    """Espelha _ficha.md, log.md e todo o conteúdo de midia/ de um lead no Drive,
    dentro de Agrostech/<event_code>/<nome-da-pasta-do-lead>/."""
    root_name = os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_NAME", "Agrostech").strip() or "Agrostech"
    lead_folder_id = _ensure_path([root_name, event_code, lead_dir.name])

    for doc in ("_ficha.md", "log.md"):
        f = lead_dir / doc
        if f.exists():
            _upload_or_update(f, lead_folder_id)

    midia_dir = lead_dir / "midia"
    if midia_dir.exists():
        midia_folder_id = _find_or_create_folder("midia", lead_folder_id)
        for f in midia_dir.iterdir():
            if f.is_file():
                _upload_or_update(f, midia_folder_id)

    logger.info("Lead '%s' sincronizado com o Google Drive.", lead_dir.name)
