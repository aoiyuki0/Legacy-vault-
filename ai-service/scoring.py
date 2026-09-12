"""
Scoring / Verification Engine
Combines AI, OCR, QR, Registry into final decision.
"""

from typing import Dict


def compute_final_verdict(ai_result: Dict, ocr_result: Dict, qr_result: Dict, registry_result: Dict) -> Dict:
    """
    Decision logic:
    - REJECTED if AI says REJECTED or strong tampering or wrong doc type
    - NEEDS_REVIEW if registry mismatch or QR fail or low confidence or missing fields
    - VERIFIED only if AI VERIFIED + registry verified + required fields + no strong tamper + QR approved or not required but consistent
    """

    # Defaults
    ai_status = ai_result.get("ai_status") or ai_result.get("status") or "NEEDS_REVIEW"
    ai_conf = ai_result.get("confidence", 0) or 0
    # Handle confidence 0-100 vs 0-1
    if ai_conf > 1:
        ai_conf = ai_conf / 100

    required_fields_present = ai_result.get("required_fields_present", True)
    if required_fields_present is None:
        required_fields_present = True

    # OCR sanity
    ocr_has_cert = bool(ocr_result.get("certificate_number"))
    ocr_has_name = bool(ocr_result.get("deceased_name"))

    # QR
    qr_detected = qr_result.get("qr_detected", False)
    qr_approved = qr_result.get("approved_issuer", False)

    # Registry
    registry_verified = registry_result.get("verified", False)

    issues = []
    issues.extend(ai_result.get("tampering_indicators", []) or ai_result.get("issues", []) or [])

    checks = {
        "ai_status": ai_status,
        "ai_confidence": round(float(ai_conf), 3),
        "required_fields_present": required_fields_present,
        "ocr_certificate_number": ocr_result.get("certificate_number", ""),
        "ocr_deceased_name": ocr_result.get("deceased_name", ""),
        "ocr_date_of_death": ocr_result.get("date_of_death", ""),
        "qr_detected": qr_detected,
        "qr_approved_issuer": qr_approved,
        "qr_reason": qr_result.get("reason", ""),
        "registry_verified": registry_verified,
        "registry_reason": registry_result.get("reason", ""),
        "visual_integrity": ai_result.get("visual_integrity", "unknown"),
        "document_type": ai_result.get("document_type", ""),
        "document_readable": ai_result.get("document_readable", True),
    }

    # Decision
    # 1. Strong reject signals
    if ai_status == "REJECTED":
        final = "REJECTED"
        reason = ai_result.get("reason", "AI marked document as rejected")
    elif ai_result.get("document_type") and ai_result["document_type"] not in ["death_certificate", "death certificate", "death-certificate"]:
        # If AI says not a death certificate
        if "death" not in ai_result["document_type"].lower():
            final = "REJECTED"
            reason = f"Document type is {ai_result['document_type']}, not death certificate"
        else:
            final = "NEEDS_REVIEW"
            reason = "Document type unclear"
    elif ai_result.get("visual_integrity") == "suspicious" and ai_conf > 0.85:
        final = "REJECTED"
        reason = "Strong visual tampering indicators"
        issues.append("Visual integrity: suspicious")
    elif not ai_result.get("document_readable", True):
        final = "NEEDS_REVIEW"
        reason = "Document not readable, requires human review"
    elif not required_fields_present or (not ocr_has_cert and not ai_result.get("certificate_number")):
        final = "NEEDS_REVIEW"
        reason = "Required fields missing"
        issues.append("Missing certificate number or required fields")
    elif not registry_verified:
        # Registry mismatch -> needs review (not outright reject for hackathon)
        final = "NEEDS_REVIEW"
        reason = registry_result.get("reason", "Registry check failed")
    elif ai_status == "VERIFIED" and registry_verified:
        # QR is not mandatory but if present should be approved
        if qr_detected and not qr_approved:
            final = "NEEDS_REVIEW"
            reason = "Registry matched but QR issuer not approved"
            issues.append(qr_result.get("reason", ""))
        else:
            final = "VERIFIED"
            reason = "AI verification passed and registry matched"
    else:
        final = "NEEDS_REVIEW"
        reason = ai_result.get("reason", "Insufficient evidence for verification")

    # Confidence adjustment
    confidence = float(ai_conf)
    if final == "VERIFIED" and registry_verified:
        confidence = min(0.99, confidence + 0.05)
        if qr_approved:
            confidence = min(0.99, confidence + 0.02)
    elif final == "NEEDS_REVIEW":
        confidence = max(0.5, confidence * 0.9)
    elif final == "REJECTED":
        confidence = max(confidence, 0.75)

    # Build final response
    return {
        "status": final,
        "confidence": round(confidence, 3),
        "reason": reason,
        "checks": checks,
        "issues": issues,
        "requires_human_review": final != "VERIFIED",
    }
