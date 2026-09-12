"""
OCR module - Extract and normalize text from certificate images/PDFs
Uses Tesseract + OpenCV preprocessing
"""

import re
from pathlib import Path
import fitz  # PyMuPDF
import cv2
import numpy as np
import pytesseract
from PIL import Image


def preprocess_image(image_path: str) -> str:
    """Preprocess image for better OCR: grayscale, denoise, threshold."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        # Adaptive threshold
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2
        )
        # Save temp preprocessed
        temp_path = f"{image_path}_pre.png"
        cv2.imwrite(temp_path, thresh)
        return temp_path
    except Exception:
        return image_path


def extract_text_from_image(image_path: str) -> str:
    """Extract raw text from image using Tesseract."""
    try:
        pre_path = preprocess_image(image_path)
        text = pytesseract.image_to_string(Image.open(pre_path), lang="eng")
        # Cleanup temp if created
        if pre_path != image_path:
            try:
                Path(pre_path).unlink(missing_ok=True)
            except:
                pass
        return text
    except Exception as e:
        print(f"OCR error: {e}")
        return ""


def extract_text_from_pdf(pdf_path: str, max_pages: int = 5) -> str:
    """Extract text from PDF via both embedded text and OCR fallback."""
    texts = []
    try:
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            # Try embedded text first
            embedded = page.get_text()
            if embedded and len(embedded.strip()) > 30:
                texts.append(embedded)
            else:
                # Fallback to OCR on rendered image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                temp_img = f"{pdf_path}_page_{i}_ocr.png"
                pix.save(temp_img)
                ocr_text = extract_text_from_image(temp_img)
                texts.append(ocr_text)
                try:
                    Path(temp_img).unlink(missing_ok=True)
                except:
                    pass
        doc.close()
    except Exception as e:
        print(f"PDF OCR error: {e}")
    return "\n".join(texts)


def normalize_fields(raw_text: str) -> dict:
    """Regex normalize extracted fields."""
    text = raw_text or ""
    # Certificate number patterns
    cert_patterns = [
        r"Certificate\s*No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)",
        r"Registration\s*No\.?\s*[:\-]?\s*([A-Z0-9\-\/]+)",
        r"Certificate\s*Number\s*[:\-]?\s*([A-Z0-9\-\/]+)",
        r"\b(DC[\-A-Z0-9]+)\b",
        r"\b(CRS[\-A-Z0-9]+)\b",
    ]
    cert_no = ""
    for pat in cert_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            cert_no = m.group(1).strip()
            break

    # Name patterns
    name_patterns = [
        r"Name\s*of\s*Deceased\s*[:\-]?\s*([A-Za-z\s\.]+)",
        r"Deceased\s*Name\s*[:\-]?\s*([A-Za-z\s\.]+)",
        r"Name\s*[:\-]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)",
    ]
    name = ""
    for pat in name_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            name = m.group(1).strip().split("\n")[0].strip()
            # Clean to 2-3 words
            name = " ".join(name.split()[:3])
            break

    # Date of death
    date_patterns = [
        r"Date\s*of\s*Death\s*[:\-]?\s*(\d{4}[\-\/]\d{2}[\-\/]\d{2})",
        r"Date\s*of\s*Death\s*[:\-]?\s*(\d{2}[\-\/]\d{2}[\-\/]\d{4})",
        r"DOD\s*[:\-]?\s*(\d{4}[\-\/]\d{2}[\-\/]\d{2})",
        r"(\d{4}-\d{2}-\d{2})",
    ]
    dod = ""
    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            dod = m.group(1).strip()
            # Normalize to YYYY-MM-DD if DD/MM/YYYY
            if "/" in dod or len(dod.split("-")[0]) == 2:
                # Attempt to parse DD-MM-YYYY
                parts = re.split(r"[\-\/]", dod)
                if len(parts) == 3:
                    if len(parts[0]) == 4:
                        dod = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                    else:
                        dod = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            break

    # Authority
    auth_patterns = [
        r"Issuing\s*Authority\s*[:\-]?\s*([A-Za-z\s\.\,]+)",
        r"(Municipal\s*Corporation[^\n]*)",
        r"(crsorgi\.gov\.in)",
        r"(suratmunicipal\.gov\.in)",
    ]
    authority = ""
    for pat in auth_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            authority = m.group(1).strip().split("\n")[0].strip()
            break

    return {
        "certificate_number": cert_no,
        "deceased_name": name,
        "date_of_death": dod,
        "issuing_authority": authority,
        "raw_text": text[:2000],  # limit for AI
    }


def run_ocr(file_path: str) -> dict:
    """Main OCR entry: returns normalized fields + raw text."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        raw = extract_text_from_pdf(file_path)
    elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
        raw = extract_text_from_image(file_path)
    else:
        raise ValueError("Unsupported file format for OCR")

    fields = normalize_fields(raw)
    fields["ocr_text"] = raw
    return fields
