import redis
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis():
    """Retorna cliente Redis"""
    return redis_client



