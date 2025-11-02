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

from fastapi import FastAPI, status as http_status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth
from .services.supabase import supabase
from .services.supabase import supabase_admin

from .routers import admin
from .routers import teacher

# === Inicialización de la aplicación ===

#: Instancia principal de la aplicación FastAPI.
#: 
#: Se define el título, descripción y versión de la API para generar la
#: documentación automática en Swagger y Redoc.
app = FastAPI(
    title="TatoMaths API",
    description="API para la aplicación TatoMaths - Juegos educativos accesibles",
    version="1.1.0"
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
        "message": "TatoMaths API ",
        "status": "online",
        "version": "1.1.0",
        "docs": "/docs"
    }

# Ruta de salud
@app.get("/health")
def health_check():
    """
    Verificación de salud del servicio (health check).

    Este endpoint permite comprobar rápidamente si el servidor está activo y respondiendo.
    También verifica la conexión con la base de datos Supabase.

    Returns:
        dict: Objeto con el estado de la API, incluyendo:
            - status: Estado general ("healthy" o "unhealthy")
            - version: Versión de la API
            - services: Estado de cada servicio (api, database)

    Response Codes:
        - 200: Todos los servicios están operativos
        - 503: Algún servicio no está disponible
    """
    # Estado inicial
    db_status = "unavailable"
    overall_status = "unhealthy"
    status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE

    # Intentar verificar la conexión a la base de datos
    try:
        # Realizar una consulta simple para verificar conectividad
        # Intentamos obtener el primer registro de users (o cualquier tabla)
        response = supabase_admin.table("users").select("id").limit(1).execute()

        # Si no hay error, la BD está operativa
        db_status = "operational"
        overall_status = "healthy"
        status_code = http_status.HTTP_200_OK

    except Exception as e:
        # Si hay error, registramos que la BD no está disponible
        db_status = f"unavailable: {str(e)[:100]}"  # Limitamos el mensaje de error
        overall_status = "unhealthy"
        status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": overall_status,
        "version": "1.1.0",
        "services": {
            "api": "operational",
            "database": db_status,
            "response": response
        }
    }

app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])