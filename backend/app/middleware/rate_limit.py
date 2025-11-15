from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.db.redis_client import get_redis
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware para rate limiting usando Redis"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.redis_client = get_redis()
    
    async def dispatch(self, request: Request, call_next):
        # Obter IP do cliente
        client_ip = request.client.host
        
        # Criar chave Redis
        key = f"rate_limit:{client_ip}"
        
        # Verificar contador atual
        current = self.redis_client.get(key)
        
        if current is None:
            # Primeira requisição neste minuto
            self.redis_client.setex(key, 60, "1")
        else:
            count = int(current)
            if count >= self.requests_per_minute:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
            self.redis_client.incr(key)
        
        response = await call_next(request)
        return response



