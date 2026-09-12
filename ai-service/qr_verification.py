"""
QR Verification - Detect and validate QR codes on certificates
"""

import cv2
from pathlib import Path
import fitz
from PIL import Image

try:
    from pyzbar.pyzbar import decode as pyzbar_decode

    HAS_PYZBAR = True
except Exception as e:
    HAS_PYZBAR = False
    print(f"pyzbar not available ({e}), QR fallback to OpenCV only")

try:
    import numpy as np

    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

APPROVED_ISSUERS = [
    "crsorgi.gov.in",
    "suratmunicipal.gov.in",
    "gov.in",
    "municipal.gov.in",
]


def _decode_with_opencv(image_path: str) -> list:
    """Fallback QR decode using OpenCV QRCodeDetector."""
    try:
        detector = cv2.QRCodeDetector()
        img = cv2.imread(image_path)
        if img is None:
            return []
        # detectAndDecodeMulti is more robust
        try:
            retval, decoded_infos, points, _ = detector.detectAndDecodeMulti(img)
            if retval and decoded_infos:
                return [d for d in decoded_infos if d]
        except:
            pass
        data, bbox, _ = detector.detectAndDecode(img)
        if data:
            return [data]
        return []
    except Exception as e:
        print(f"OpenCV QR error: {e}")
        return []


def decode_qr_from_image(image_path: str) -> list:
    """Decode QR codes from single image."""
    results = []
    if HAS_PYZBAR:
        try:
            decoded = pyzbar_decode(Image.open(image_path))
            for d in decoded:
                try:
                    results.append(d.data.decode("utf-8", errors="ignore"))
                except:
                    pass
        except Exception as e:
            print(f"pyzbar error: {e}")

    if not results and HAS_CV2:
        results.extend(_decode_with_opencv(image_path))

    return results


def decode_qr_from_pdf(pdf_path: str, max_pages: int = 5) -> list:
    """Render PDF pages and scan for QR."""
    all_results = []
    try:
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            temp_img = f"{pdf_path}_qr_page_{i}.png"
            pix.save(temp_img)
            decoded = decode_qr_from_image(temp_img)
            all_results.extend(decoded)
            try:
                Path(temp_img).unlink(missing_ok=True)
            except:
                pass
        doc.close()
    except Exception as e:
        print(f"QR PDF error: {e}")
    return all_results


def verify_qr(qr_data_list: list) -> dict:
    """
    Verify QR data against approved issuers.
    We do NOT claim domain alone proves authenticity - only consistency signal.
    """
    if not qr_data_list:
        return {
            "qr_detected": False,
            "qr_data": None,
            "domain_verified": False,
            "approved_issuer": False,
            "reason": "No QR code detected",
        }

    qr_data = qr_data_list[0]  # take first
    qr_lower = qr_data.lower()

    # Check if any approved domain in URL
    approved = any(issuer.lower() in qr_lower for issuer in APPROVED_ISSUERS)
    domain_verified = "http" in qr_lower or ".gov" in qr_lower

    if approved:
        reason = f"QR contains approved issuer domain: {qr_data[:120]}"
    elif domain_verified:
        reason = f"QR contains government-like domain but not in approved list: {qr_data[:120]}"
    else:
        reason = f"QR detected but no approved issuer: {qr_data[:120]}"

    return {
        "qr_detected": True,
        "qr_data": qr_data,
        "domain_verified": domain_verified,
        "approved_issuer": approved,
        "reason": reason,
    }


def run_qr_check(file_path: str) -> dict:
    """Main QR entry point."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        decoded = decode_qr_from_pdf(file_path)
    elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
        decoded = decode_qr_from_image(file_path)
    else:
        decoded = []

    return verify_qr(decoded)
