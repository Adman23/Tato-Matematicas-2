"""
!! EDITED 1.2.0
    -> Changed all the comments to english and fixed some.
    -> edited basic config of the routers to not use /api prefix
    
TatoMaths API - Backend to connect to Supabase and serve the frontend app.

This module initializes the main FastAPI app, settings, middlewares, routes
to provide the necessary backend functionality.

Incluye:
    - CORS config.
    - Routers inclusion.
    - Basic routes (root, health).
"""

from fastapi import FastAPI, status as http_status      # FastAPI import
from fastapi.middleware.cors import CORSMiddleware      # CORS
from .config import settings                            # config.py settings that use the .env
from .services.supabase import supabase, supabase_admin # Clients for the database connection

# Routers
from .routers import auth
from .routers import admin
from .routers import teacher
from .routers import student
from .routers import games
from .routers import user

# === App initialization ===

#: Main instance of FastAPI application.
#: 
#: Title, description, and version of the app.
#: version 1.2.0 -> Includes vast changes in all of the routers and creation of new ones
app = FastAPI(
    title="TatoMaths API",
    description="Tatomaths API - creation of accesible math games",
    version="1.2.0"
) 

# === CORS  ===

#: Allowed origins to connect from the front.
#: 
#: settings.ALLOWED_ORIGINS has the needed values 
#: to allow multiple domains, all methods and headers are allowed
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ROUTERS ===

#: Routers -> These are the containers of the endpoints that connect to the database
#:
app.include_router(auth.router,     prefix="/auth",     tags=["auth"])
app.include_router(admin.router,    prefix="/admin",    tags=["admin"])
app.include_router(teacher.router,  prefix="/teacher",  tags=["teacher"])
app.include_router(student.router,  prefix="/student",  tags=["student"])
app.include_router(user.router,     prefix="/user",     tags=["user"])
app.include_router(games.router,    prefix="/games",    tags=["games"])


# === BASIC ENDPOINTS ===
#:
#: These routers don't fall in any category, they serve very elemental functions for the app

# Root
@app.get("/")
def read_root():
    """
    Root endpoint for the API

    Basic status and welcome message.

    Returns:
        dict: Very basic info of the version and title.
    """
    return {
        "message": app.title,
        "version": app.version,
        "docs": "/docs"
    }


# Health check
@app.get("/health")
def health_check():
    """
    Verify the service is up and running.

    Returns:
        dict: API object:
            - status: Estado general ("healthy" o "unhealthy")
            - version: Versión de la API
            - services: Estado de cada servicio (api, database)

    Response Codes:
        - 200: Todos los servicios están operativos
        - 503: Algún servicio no está disponible
    """
    # Initial state
    db_status = "unavailable"
    overall_status = "unhealthy"
    status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE

    # Try to verify connection
    try:
        # Realizar una consulta simple para verificar conectividad
        # Intentamos obtener el primer registro de users (o cualquier tabla)
        response = supabase_admin.table("users").select("id").limit(1).execute()

        # If no error
        db_status = "operational"
        overall_status = "healthy"
        status_code = http_status.HTTP_200_OK

    except Exception as e:
        # If any error shows up
        db_status = f"unavailable: {str(e)[:100]}" 
        overall_status = "unhealthy"
        status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": overall_status,
        "version": app.version,
        "services": {
            "status_code": status_code,
            "database":    db_status,
            "response":    response
        }
    }