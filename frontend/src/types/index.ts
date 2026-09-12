export enum AssetStatus {
  Locked = 0,
  ClaimPending = 1,
  Unlocked = 2,
}

export interface Asset {
  id: number;
  owner: string;
  nominee: string;
  name: string;
  ipfsCid: string;
  status: AssetStatus;
  nomineeAccepted: boolean;
}

export interface AiVerificationResult {
  success: boolean;
  verification?: {
    status: 'APPROVED' | 'FLAGGED' | 'REJECTED';
    confidence: number;
    reason: string;
    checks: Record<string, boolean>;
    issues: string[];
    requires_human_review: boolean;
    ai_analysis?: {
      certificate_number?: string;
      deceased_name?: string;
      date_of_death?: string;
      issuing_authority?: string;
      cause_of_death?: string;
    };
    ocr?: {
      certificate_number?: string | null;
      deceased_name?: string | null;
      date_of_death?: string | null;
      issuing_authority?: string | null;
    };
    qr?: {
      qr_detected: boolean;
      qr_data?: string | null;
      domain_verified?: boolean;
      approved_issuer?: boolean;
      reason?: string;
    };
    registry_check?: {
      record_found: boolean;
      match_confidence?: number;
      verified_date?: string;
    };
  };
  message?: string;
}

export type NavTab = 'dashboard' | 'nominee' | 'claim' | 'explorer';

