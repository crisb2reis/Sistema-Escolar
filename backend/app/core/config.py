from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    POSTGRES_USER: str = "frequencia_user"
    POSTGRES_PASSWORD: str = "frequencia_pass"
    POSTGRES_DB: str = "frequencia_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # QR Code
    QR_TOKEN_EXPIRE_MINUTES: int = 10
    QR_TOKEN_SECRET_KEY: str
    
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # CORS - usar string separada por vírgula no .env
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 5
    
    # Geofence (opcional)
    GEOFENCE_ENABLED: bool = False
    GEOFENCE_RADIUS_METERS: int = 100
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Retorna lista de origens CORS"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()

