import logging
from pathlib import Path

import PyPDF2
import docx

logger = logging.getLogger(__name__)


def extract_text(file_path: Path) -> str:
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(file_path)
    elif suffix == ".docx":
        return _extract_docx(file_path)
    elif suffix == ".doc":
        logger.warning("Old .doc format not supported: %s", file_path.name)
        return ""
    elif suffix == ".txt":
        return _extract_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf(path: Path) -> str:
    try:
        text_parts: list[str] = []
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        logger.warning("Failed to extract text from PDF %s: %s", path.name, e)
        return ""


def _extract_docx(path: Path) -> str:
    try:
        doc = docx.Document(str(path))
        return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    except Exception as e:
        logger.warning("Failed to extract text from DOCX %s: %s", path.name, e)
        return ""


def _extract_txt(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        logger.warning("Failed to read text file %s: %s", path.name, e)
        return ""


