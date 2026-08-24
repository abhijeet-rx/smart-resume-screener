import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app as _app

# Explicit top-level assignment for Vercel serverless builder AST analysis
app = _app
app.app = app


