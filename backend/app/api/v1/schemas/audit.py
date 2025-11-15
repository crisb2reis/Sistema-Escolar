from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    action: str
    details: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True



