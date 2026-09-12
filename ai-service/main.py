import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from verification import analyze_death_certificate
from ocr import run_ocr
from qr_verification import run_qr_check
from mock_registry import verify_certificate
from scoring import compute_final_verdict

app = FastAPI(
    title="Legacy Vault AI Verification Service",
    version="1.0.0",
    description="AI + OCR + QR + Mock Registry verification for death certificates",
)

# Allow backend to call
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "Legacy Vault AI Verification", "status": "running"}


@app.get("/health")
async def health():
    return {"success": True, "service": "ai-service"}


@app.post("/verify-death-certificate")
async def verify_death_certificate(file: UploadFile = File(...)):
    allowed_types = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    ]

    if file.content_type not in allowed_types:
        # Also allow generic octet-stream for some browsers
        if file.content_type not in ["application/octet-stream"]:
            raise HTTPException(
                status_code=400, detail="Only PDF, JPG, PNG or WEBP files are supported"
            )

    extension = os.path.splitext(file.filename or "")[1]
    if not extension:
        # infer from content_type
        if file.content_type == "application/pdf":
            extension = ".pdf"
        elif file.content_type == "image/jpeg":
            extension = ".jpg"
        else:
            extension = ".png"

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        # 1. OCR
        try:
            ocr_result = run_ocr(temp_path)
        except Exception as e:
            print(f"OCR failed: {e}")
            ocr_result = {
                "certificate_number": "",
                "deceased_name": "",
                "date_of_death": "",
                "issuing_authority": "",
                "raw_text": "",
                "ocr_text": "",
            }

        # 2. QR
        try:
            qr_result = run_qr_check(temp_path)
        except Exception as e:
            print(f"QR failed: {e}")
            qr_result = {
                "qr_detected": False,
                "qr_data": None,
                "domain_verified": False,
                "approved_issuer": False,
                "reason": f"QR check error: {e}",
            }

        # 3. AI (with OCR text)
        ai_result = analyze_death_certificate(temp_path, ocr_result.get("ocr_text", ""))

        # Fallback: if AI missed fields but OCR has them, merge
        for field in ["certificate_number", "deceased_name", "date_of_death", "issuing_authority"]:
            if not ai_result.get(field) and ocr_result.get(field):
                ai_result[field] = ocr_result[field]

        # 4. Registry
        registry_result = verify_certificate(
            ai_result.get("certificate_number", ""),
            ai_result.get("deceased_name", ""),
            ai_result.get("date_of_death", ""),
        )

        # 5. Scoring
        final = compute_final_verdict(ai_result, ocr_result, qr_result, registry_result)

        return {
            "success": True,
            "verification": {
                "status": final["status"],
                "confidence": final["confidence"],
                "reason": final["reason"],
                "checks": final["checks"],
                "issues": final["issues"],
                "requires_human_review": final["requires_human_review"],
                "ai_analysis": ai_result,
                "ocr": {
                    "certificate_number": ocr_result.get("certificate_number"),
                    "deceased_name": ocr_result.get("deceased_name"),
                    "date_of_death": ocr_result.get("date_of_death"),
                    "issuing_authority": ocr_result.get("issuing_authority"),
                },
                "qr": qr_result,
                "registry_check": registry_result,
            },
        }

    except ValueError as ve:
        print(f"Verification ValueError: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as error:
        print(f"Verification error: {error}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail="AI verification failed")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


# For local debug
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
