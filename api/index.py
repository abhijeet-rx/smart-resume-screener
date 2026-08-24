import sys
import os
from pathlib import Path

# Add backend directory and root directory to Python path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for p in (str(backend_dir), str(root_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except ModuleNotFoundError:
    from backend.app.main import app

