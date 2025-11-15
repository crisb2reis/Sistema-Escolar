from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.api import api_router

# Setup logging
setup_logging()

# Criar aplicação FastAPI
app = FastAPI(
    title="Sistema de Frequência Escolar",
    description="API para controle de frequência escolar com QR Code",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas da API
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Sistema de Frequência Escolar API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

