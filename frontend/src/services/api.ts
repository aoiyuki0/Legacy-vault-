import { AiVerificationResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function uploadToPinata(file: File): Promise<{ success: boolean; cid?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return { success: true, cid: data.cid };
  } catch (error: any) {
    console.error('IPFS upload error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to backend upload service on port 5000.' 
    };
  }
}

export async function verifyDeathCertificate(file: File): Promise<AiVerificationResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/ai/verify-death-certificate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Verification failed with status ${response.status}`);
    }

    const data: AiVerificationResult = await response.json();
    return data;
  } catch (error: any) {
    console.warn('AI verification API call failed, providing simulation fallback option:', error);
    throw error;
  }
}

export async function unlockAssetViaBackend(assetId: number): Promise<{ success: boolean; transactionHash?: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/blockchain/unlock/${assetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Backend unlock error:', error);
    return {
      success: false,
      message: error.message || 'Failed to request unlock via backend'
    };
  }
}

export function getIpfsUrl(cid: string): string {
  if (!cid) return '#';
  if (cid.startsWith('http://') || cid.startsWith('https://')) return cid;
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

// Generate demo verification result when testing in offline/standalone mode
export function getMockVerificationResult(fileName: string): AiVerificationResult {
  return {
    success: true,
    verification: {
      status: 'APPROVED',
      confidence: 0.94,
      reason: 'Official death certificate validated: OCR details, QR issuer signature, and Civil Registry match confirmed.',
      checks: {
        ocr_text_extracted: true,
        deceased_name_matched: true,
        date_of_death_valid: true,
        qr_code_verified: true,
        registry_record_found: true,
        security_watermark_detected: true,
      },
      issues: [],
      requires_human_review: false,
      ai_analysis: {
        certificate_number: 'D-2026-98412-IN',
        deceased_name: 'Arthur Pendelton Vance',
        date_of_death: '2026-08-14',
        issuing_authority: 'Metropolitan Vital Statistics Registry',
        cause_of_death: 'Natural causes / Cardiopulmonary arrest',
      },
      ocr: {
        certificate_number: 'D-2026-98412-IN',
        deceased_name: 'Arthur Pendelton Vance',
        date_of_death: '2026-08-14',
        issuing_authority: 'Metropolitan Vital Statistics Registry',
      },
      qr: {
        qr_detected: true,
        qr_data: 'https://registry.gov.example/verify/D-2026-98412-IN',
        domain_verified: true,
        approved_issuer: true,
        reason: 'Cryptographic signature from verified municipal authority.'
      },
      registry_check: {
        record_found: true,
        match_confidence: 0.98,
        verified_date: '2026-08-15T10:30:00Z',
      },
    },
  };
}
