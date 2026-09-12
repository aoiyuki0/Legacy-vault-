"""
AI Verification Engine - OpenRouter + OCR + Images
"""

import base64
import json
import os
from pathlib import Path

from PIL import Image
import fitz  # PyMuPDF


def get_openai_client():
    """Lazy client creation so .env can be loaded first."""
    from openai import OpenAI

    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not defined in ai-service/.env")

    # OpenRouter uses OpenAI-compatible API
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    return client


def pdf_to_images(file_path: str, max_pages: int = 5):
    """Convert PDF pages into PNG images. Returns list of image paths."""
    document = fitz.open(file_path)
    image_paths = []
    for page_number, page in enumerate(document):
        if page_number >= max_pages:
            break
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
        image_path = f"{file_path}_page_{page_number}.png"
        pixmap.save(image_path)
        image_paths.append(image_path)
    document.close()
    return image_paths


def image_to_data_url(image_path: str) -> str:
    """Convert image to base64 data URL (JPEG)."""
    image = Image.open(image_path)
    if image.mode != "RGB":
        image = image.convert("RGB")
    temp_path = f"{image_path}.jpg"
    image.save(temp_path, format="JPEG", quality=90)
    with open(temp_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
    # Cleanup temp jpg
    try:
        Path(temp_path).unlink(missing_ok=True)
    except:
        pass
    return f"data:image/jpeg;base64,{encoded}"


def analyze_death_certificate(file_path: str, ocr_text: str = ""):
    """
    Main AI analysis. Takes file_path and optional OCR text.
    Returns structured dict.
    """
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        image_paths = pdf_to_images(file_path)
    elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
        image_paths = [file_path]
    else:
        raise ValueError("Unsupported file format")

    # Build content for OpenRouter
    prompt_text = f"""
You are the preliminary AI document verification assistant for Legacy Vault.

Analyze the provided death certificate carefully.

IMPORTANT:
You cannot definitively determine whether a government document is legally authentic or original from visual inspection alone.
Your job is to perform PRELIMINARY verification.

OCR EXTRACTED TEXT (may be imperfect, use as additional signal):
---
{ocr_text[:3000] if ocr_text else "No OCR text available"}
---

Check:
1. Whether the document appears to be a death certificate.
2. Whether the document is readable.
3. Whether expected fields appear to exist (name, date of death, certificate number, authority, registration date).
4. Name of deceased, if visible.
5. Date of death, if visible (YYYY-MM-DD).
6. Registration/certificate number, if visible.
7. Issuing authority, if visible.
8. Whether dates appear logically consistent.
9. Whether there are obvious visual inconsistencies, manipulation indicators, missing sections or suspicious alterations.
10. Whether the document provides enough information for further verification.

Return ONLY valid JSON in this exact structure:

{{
    "document_type": "death_certificate",
    "document_readable": true,
    "deceased_name": "",
    "date_of_death": "",
    "certificate_number": "",
    "issuing_authority": "",
    "required_fields_present": true,
    "visual_integrity": "clean",
    "tampering_indicators": [],
    "logical_consistency": true,
    "ai_status": "VERIFIED",
    "confidence": 0.85,
    "reason": "",
    "requires_human_review": false
}}

visual_integrity allowed: clean, suspicious, tampered
ai_status allowed: VERIFIED, REJECTED, NEEDS_REVIEW
confidence 0.0 - 1.0
Do not claim legal authenticity. This is preliminary.
"""

    content = [{"type": "text", "text": prompt_text}]

    for image_path in image_paths:
        try:
            data_url = image_to_data_url(image_path)
            content.append({"type": "image_url", "image_url": {"url": data_url}})
        except Exception as e:
            print(f"Image encode error {image_path}: {e}")

    # Cleanup rendered PDFs
    pdf_generated = ext == ".pdf"

    client = get_openai_client()
    model = os.getenv("OPENROUTER_MODEL") or "google/gemini-2.0-flash-exp:free"

    # Try structured JSON first, fallback to plain
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}],
            response_format={"type": "json_object"},
            extra_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Legacy Vault AI Verification",
            },
        )
        raw_text = response.choices[0].message.content or "{}"
    except Exception as e:
        print(f"OpenRouter structured call failed, retrying plain: {e}")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}],
            extra_headers={
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Legacy Vault AI Verification",
            },
        )
        raw_text = response.choices[0].message.content or "{}"

    # Cleanup pdf images
    if pdf_generated:
        for p in image_paths:
            try:
                Path(p).unlink(missing_ok=True)
            except:
                pass

    # Parse JSON
    try:
        parsed = json.loads(raw_text)
        # Handle if model wrapped in ```json
        if isinstance(parsed, str):
            parsed = json.loads(parsed)
    except Exception:
        # Try to extract JSON block
        import re

        m = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if m:
            parsed = json.loads(m.group(0))
        else:
            raise ValueError(f"AI returned non-JSON: {raw_text[:500]}")

    # Normalize legacy keys to scoring expected
    if "status" in parsed and "ai_status" not in parsed:
        parsed["ai_status"] = parsed["status"]
    if "issues" in parsed and "tampering_indicators" not in parsed:
        parsed["tampering_indicators"] = parsed["issues"]

    # Ensure required keys
    defaults = {
        "document_type": "death_certificate",
        "document_readable": True,
        "deceased_name": "",
        "date_of_death": "",
        "certificate_number": "",
        "issuing_authority": "",
        "required_fields_present": True,
        "visual_integrity": "clean",
        "tampering_indicators": [],
        "logical_consistency": True,
        "ai_status": "NEEDS_REVIEW",
        "confidence": 0.5,
        "reason": "",
        "requires_human_review": True,
    }
    for k, v in defaults.items():
        parsed.setdefault(k, v)

    return parsed
