export interface Session {
  id: string;
  class_id: string;
  teacher_id: string;
  subject_id?: string | null;
  start_at: string;
  end_at: string | null;
  status: 'open' | 'closed';
  created_at: string;
  class?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface SessionCreate {
  start_at: string;
  subject_id?: string;
}

export interface QRCodeResponse {
  token_id: string;
  token: string;
  qr_image_base64: string;
  expires_at: string;
}

