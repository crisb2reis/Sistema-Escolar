from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from typing import Optional, Dict, Any


async def log_audit(
    db: Session,
    actor_id: str,
    action: str,
    details: Optional[Dict[str, Any]] = None
):
    """Registra ação de auditoria"""
    audit_log = AuditLog(
        actor_id=actor_id,
        action=action,
        details=details
    )
    db.add(audit_log)
    db.commit()



