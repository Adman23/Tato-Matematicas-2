"""
TatoMaths API - Backend Principal.

Este módulo inicializa la aplicación principal de FastAPI, configurando
los middlewares, rutas y ajustes globales necesarios para el correcto
funcionamiento del backend de la app.

Incluye:
    - Configuración de CORS.
    - Inclusión de routers (por ejemplo, autenticación).
    - Rutas básicas de estado y diagnóstico (raíz y health check).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth

# === Inicialización de la aplicación ===

#: Instancia principal de la aplicación FastAPI.
#: 
#: Se define el título, descripción y versión de la API para generar la
#: documentación automática en Swagger y Redoc.
app = FastAPI(
    title="TatoMaths API",
    description="API para la aplicación TatoMaths - Juegos educativos accesibles",
    version="1.0.0"
) 

# === Configuración de CORS ===

#: Configura los orígenes permitidos para solicitudes desde el frontend.
#: 
#: Los valores se obtienen desde `settings.ALLOWED_ORIGINS` y se dividen por comas
#: para admitir múltiples dominios. Se permiten todos los métodos y cabeceras.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Registro de routers ===

#: Se incluyen los routers que gestionan las distintas rutas del backend.
#: 
#: Actualmente, solo se importa el router de autenticación (`auth.router`),
#: pero se pueden añadir otros módulos en el futuro (por ejemplo, `students`, `games`, etc.).
app.include_router(auth.router)
app.include_router(auth.router)

# Ruta raíz
@app.get("/")
def read_root():
    """
    Endpoint raíz de la API.

    Devuelve un mensaje de bienvenida y datos básicos del estado de la API.

    Returns:
        dict: Información básica con mensaje, estado, versión y enlace a la documentación.
    """
    return {
        "message": "TatoMaths API ✅",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Ruta de salud
@app.get("/health")
def health_check():
    """
    Verificación de salud del servicio (health check).

    Este endpoint permite comprobar rápidamente si el servidor está activo y respondiendo.

    Returns:
        dict: Objeto con el estado de la API.
    """
    return {"status": "healthy"}
