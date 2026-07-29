"""
Agrostech Digital Company OS — Master System Launcher
Launches all core background services and systems automatically (excluding WhatsApp integration).

Usage:
    python start_system.py
"""

import os
import sys
import time
import subprocess
from pathlib import Path

# Add current folder to path
RUNNER_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(RUNNER_DIR))

# stdout/stderr herdam a codepage do console (cp1252 no Windows) quando não
# há terminal UTF-8 anexado — ex.: processo em background, saída redirecionada
# para arquivo/pipe. O header abaixo usa emoji (🚁), que cp1252 não consegue
# codificar, derrubando o launcher antes de qualquer log útil. UTF-8 explícito
# evita isso independente de como o processo foi iniciado.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Color codes for high-tech visual feedback
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Windows Command Prompt color support
if os.name == "nt":
    os.system("")

def print_header():
    """Print a beautiful futuristic ASCII terminal header."""
    header = f"""
{BLUE}{BOLD}======================================================================
  🚁 AGROSTECH — DIGITAL COMPANY OPERATING SYSTEM (OS)
  Hybrid AI Orchestration + Human Execution | v2.5 (2026)
======================================================================{RESET}
"""
    print(header)

def check_env():
    """Verify essential environment variables in .env file."""
    print(f"[{BLUE}INFO{RESET}] Checking environment configuration...")
    env_path = RUNNER_DIR / ".env"
    
    if not env_path.exists():
        print(f"[{YELLOW}WARNING{RESET}] .env file not found at {env_path}")
        print(f"[{YELLOW}WARNING{RESET}] Attempting to run with system-wide variables.")
        return True
        
    content = env_path.read_text(encoding="utf-8")
    has_bot_token = "TELEGRAM_BOT_TOKEN" in content
    has_gemini = "GEMINI_API_KEY" in content
    has_groq = "GROQ_API_KEY" in content
    
    if not has_bot_token:
        print(f"[{RED}ERROR{RESET}] TELEGRAM_BOT_TOKEN is missing from runner/.env")
        print(f"[{RED}ERROR{RESET}] Please add it to your .env file to run the Telegram Bot.")
        return False
        
    if not has_gemini and not has_groq:
        print(f"[{YELLOW}WARNING{RESET}] Neither GEMINI_API_KEY nor GROQ_API_KEY found in runner/.env")
        print(f"[{YELLOW}WARNING{RESET}] AI Agents will fallback to MOCK mode.")
        
    print(f"[{GREEN}OK{RESET}] Environment variables validated.")
    return True

def run_db_seeder():
    """Run seed_telegram_db.py to ensure the SQLite database is ready and seeded."""
    print(f"[{BLUE}INFO{RESET}] Initializing and seeding user database...")
    seeder_script = RUNNER_DIR / "seed_telegram_db.py"
    
    try:
        # Run seeder as a subprocess and wait for completion
        result = subprocess.run(
            [sys.executable, str(seeder_script)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=True
        )
        print(f"[{GREEN}OK{RESET}] Database initialized/synced successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[{RED}ERROR{RESET}] Failed to seed database: {e.stderr}")
        return False

def launch_telegram_bot():
    """Launch the main Telegram Bot daemon."""
    print(f"[{BLUE}INFO{RESET}] Starting Agrostech Telegram Bot gateway...")
    bot_script = RUNNER_DIR / "telegram_bot.py"
    
    try:
        # Start telegram_bot.py as a persistent process
        # We let stdout/stderr stream directly to the main terminal so the user sees all incoming bot traffic!
        print(f"\n{GREEN}{BOLD}>>> SYSTEM ACTIVE. Streaming Telegram Bot logs below:{RESET}\n")
        # PYTHONIOENCODING evita a mesma UnicodeEncodeError (cp1252 x emoji) que
        # derrubava este launcher, agora também no processo filho — sem isso,
        # basta um print com emoji em telegram_bot.py (ou algo que ele importe)
        # pra derrubar o bot em produção do mesmo jeito.
        child_env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUNBUFFERED": "1"}
        subprocess.run([sys.executable, str(bot_script)], check=True, env=child_env)
    except KeyboardInterrupt:
        print(f"\n\n[{YELLOW}INFO{RESET}] System shutdown initiated by user (Ctrl+C).")
        print(f"[{GREEN}OK{RESET}] Agrostech OS safely stopped. Have a productive day!")
    except Exception as e:
        print(f"[{RED}ERROR{RESET}] Telegram Bot crashed or failed to start: {e}")

def main():
    print_header()
    time.sleep(0.5)
    
    # 1. Check environment
    if not check_env():
        sys.exit(1)
        
    time.sleep(0.3)
    
    # 2. Run Database Seeder
    if not run_db_seeder():
        sys.exit(1)
        
    time.sleep(0.3)
    
    # 3. Launch Telegram Bot Gateway
    launch_telegram_bot()

if __name__ == "__main__":
    main()
