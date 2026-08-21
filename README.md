# Smart Resume Screener

Upload a resume + job description and get structured JSON back. AI-powered resume screening that extracts key information, matches candidates to job requirements, and returns actionable scoring data.

## Architecture

```
smart-resume-screener/
├── backend/          # FastAPI + PostgreSQL API server
├── frontend/         # React + Vite SPA
├── prompts/          # LLM prompt templates for resume analysis
├── sample_data/      # Example resumes and job descriptions
├── README.md
└── .gitignore
```

## Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Frontend   | React 18 + Vite        |
| Backend    | FastAPI (Python 3.11+) |
| Database   | PostgreSQL             |
| AI/LLM     | OpenAI / Gemini        |
| File Parse | PyPDF2, python-docx    |

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- An OpenAI or Gemini API key

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database URL and API keys

uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed

npm run dev
```

The app will be available at `http://localhost:5173`.

### Database Setup

```bash
# Create the database
createdb smart_resume_screener

# Run migrations (from backend/)
alembic upgrade head
```

## API Overview

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| POST   | `/api/v1/screen`      | Upload resume + JD, get JSON back  |
| GET    | `/api/v1/screenings`  | List past screening results        |
| GET    | `/api/v1/screenings/{id}` | Get a specific screening result |
| GET    | `/api/v1/health`      | Health check                       |

## Sample Response

```json
{
  "candidate": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-0100"
  },
  "match_score": 82,
  "skills_match": {
    "matched": ["Python", "FastAPI", "PostgreSQL"],
    "missing": ["Kubernetes"],
    "bonus": ["GraphQL"]
  },
  "experience_summary": "5 years backend development...",
  "education_match": true,
  "recommendation": "STRONG_MATCH",
  "detailed_analysis": "..."
}
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all configuration options.

## License

MIT
