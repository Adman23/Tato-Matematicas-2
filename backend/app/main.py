"""
TatoMaths API - Backend Principal
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth

# Crear aplicación FastAPI
app = FastAPI(
    title="TatoMaths API",
    description="API para la aplicación TatoMaths - Juegos educativos accesibles",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)

# Ruta raíz
@app.get("/")
def read_root():
    return {
        "message": "TatoMaths API ✅",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Ruta de salud
@app.get("/health")
def health_check():
    return {"status": "healthy"}
