"""
File-parsing service — extracts text from PDF and DOCX uploads.
"""

from pathlib import Path

import PyPDF2
import docx


def extract_text(file_path: Path) -> str:
    """Return the plain-text content of a PDF or DOCX file."""
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(file_path)
    elif suffix in {".docx", ".doc"}:
        return _extract_docx(file_path)
    elif suffix == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf(path: Path) -> str:
    text_parts: list[str] = []
    with open(path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_docx(path: Path) -> str:
    doc = docx.Document(str(path))
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
