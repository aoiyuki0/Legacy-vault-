"""
Mock Government Registry - Hackathon Demo
Transparent simulation of institutional death registry.
"""

MOCK_REGISTRY = {
    "DC-DEMO-001": {
        "name": "John Doe",
        "date_of_death": "2026-08-20",
        "authority": "Example Municipal Authority",
        "status": "VALID",
        "registration_date": "2026-08-21",
    },
    "DC-DEMO-002": {
        "name": "Jane Doe",
        "date_of_death": "2026-08-21",
        "authority": "Example Municipal Authority",
        "status": "VALID",
        "registration_date": "2026-08-22",
    },
    "DC-DEMO-003": {
        "name": "Robert Smith",
        "date_of_death": "2026-07-15",
        "authority": "Surat Municipal Corporation",
        "status": "VALID",
        "registration_date": "2026-07-16",
    },
    "DC-2024-98765": {
        "name": "Amit Patel",
        "date_of_death": "2024-12-01",
        "authority": "crsorgi.gov.in",
        "status": "VALID",
        "registration_date": "2024-12-02",
    },
}


def verify_certificate(certificate_number: str, deceased_name: str, date_of_death: str):
    """
    Cross-check extracted certificate info against mock registry.
    Returns dict with verified bool and reason.
    """
    if not certificate_number:
        return {"verified": False, "reason": "Certificate number not extracted"}

    record = MOCK_REGISTRY.get(certificate_number.strip())

    if not record:
        return {"verified": False, "reason": "Certificate not found in registry"}

    if record["status"] != "VALID":
        return {"verified": False, "reason": "Registry marks certificate as invalid"}

    if deceased_name and record["name"].lower().strip() != deceased_name.lower().strip():
        return {
            "verified": False,
            "reason": f"Deceased name does not match registry (expected {record['name']})",
        }

    if date_of_death and record["date_of_death"] != date_of_death.strip():
        return {
            "verified": False,
            "reason": f"Date of death does not match registry (expected {record['date_of_death']})",
        }

    if record.get("authority"):
        return {
            "verified": True,
            "reason": "Certificate matched mock government registry",
            "registry_record": record,
        }

    return {"verified": True, "reason": "Certificate matched mock government registry"}
