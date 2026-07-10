"""
Agrostech Digital Twin — Telegram User Seeder
Initializes the SQLite database and adds default staff members with their roles.

Usage:
    # 1. Create DB and insert default test users:
    python seed_telegram_db.py
    
    # 2. Add yourself so you can test the bot:
    python seed_telegram_db.py --add [YOUR_TELEGRAM_ID] "[YOUR NAME]" [ROLE]
    
    # Roles available: admin, field_pilot, data_processing, sales, content_director, visual_identity
"""

import sys
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "telegram_users.db"

def init_db():
    """Create tables if they do not exist."""
    print(f"Initializing database at: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create Audit Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER,
        username TEXT,
        command TEXT,
        action_result TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    print("[SUCCESS] Tables created successfully.")

def add_user(telegram_id: int, name: str, role: str, username: str = None):
    """Add or update a user in the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT OR REPLACE INTO users (telegram_id, name, role, username) VALUES (?, ?, ?, ?)",
            (telegram_id, name, role.lower(), username)
        )
        conn.commit()
        print(f"[USER] Added/Updated: {name} | Telegram ID: {telegram_id} | Role: {role.upper()}")
    except Exception as e:
        print(f"[ERROR] Failed to add user: {e}")
    finally:
        conn.close()

def seed_defaults():
    """Seed default mock users representing the organizational chart roles."""
    print("\nSeeding default staff members...")
    
    # Seeding mock users for testing
    add_user(111111111, "Carlos (Admin)", "admin", "carlos_admin")
    add_user(222222222, "Rodrigo Piloto", "field_pilot", "rodrigo_pilot")
    add_user(333333333, "Mariana Processadora", "data_processing", "mari_processing")
    add_user(444444444, "Alice Vendedora", "sales", "alice_sales")
    add_user(555555555, "Mateus Conteudo", "content_director", "mateus_director")
    add_user(666666666, "Bruna Design", "visual_identity", "bruna_brand")
    
    print("\nSeeding complete!")
    print("To add yourself, run: python seed_telegram_db.py --add [YOUR_ID] \"[YOUR NAME]\" [ROLE]")

if __name__ == "__main__":
    init_db()
    
    if len(sys.argv) > 4 and sys.argv[1] == "--add":
        try:
            tid = int(sys.argv[2])
            uname = sys.argv[3]
            urole = sys.argv[4]
            add_user(tid, uname, urole)
        except ValueError:
            print("[ERROR] Invalid Telegram ID format. Must be an integer.")
    else:
        seed_defaults()
