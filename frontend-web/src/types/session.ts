export interface Session {
  id: string;
  class_id: string;
  teacher_id: string;
  start_at: string;
  end_at: string | null;
  status: 'open' | 'closed';
  created_at: string;
  class?: {
    id: string;
    name: string;
  };
}

export interface SessionCreate {
  start_at: string;
}

export interface QRCodeResponse {
  token_id: string;
  token: string;
  qr_image_base64: string;
  expires_at: string;
}

