"""
Configuración de la aplicación.

Este módulo define la configuración global del backend utilizando Pydantic
(`BaseSettings`), lo que permite cargar las variables de entorno de forma
segura y tipada.

Las variables se obtienen automáticamente desde el archivo `.env` o desde
el entorno del sistema, facilitando la separación entre entornos de desarrollo,
pruebas y producción.
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Clase de configuración principal de la aplicación.

    Gestiona las variables de entorno necesarias para el funcionamiento del
    backend. Los valores pueden definirse en un archivo `.env` o mediante
    variables de entorno del sistema.

    Atributos:
        DEV_MODE (bool): Indica si la aplicación se ejecuta en modo desarrollo.
        ALLOWED_ORIGINS (str): Dominios permitidos para solicitudes CORS.
        SUPABASE_URL (str): URL del proyecto Supabase.
        SUPABASE_ANON_KEY (str): Clave anónima pública para operaciones básicas.
        SUPABASE_JWT_SECRET (str): Secreto JWT usado por Supabase para verificar tokens.
        SUPABASE_SERVICE_ROLE (str): Clave de rol de servicio con permisos administrativos.
        APP_JWT_SECRET (str): Secreto usado para firmar los JWT propios de la aplicación.
        APP_JWT_AUDIENCE (str): Audiencia del token JWT (por defecto, "student").
        APP_JWT_ISSUER (str): Emisor de los tokens JWT (por defecto, "tatomaths").
        API_URL (str): URL base de la API (por defecto, "http://localhost:8000").
    """
    # Modo desarrollo
    DEV_MODE: bool = True
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_SERVICE_ROLE: str
    
    # JWT para estudiantes
    APP_JWT_SECRET: str
    APP_JWT_AUDIENCE: str = "student"
    APP_JWT_ISSUER: str = "tatomaths"
    
    # API
    API_URL: str = "http://localhost:8000"
    
    class Config:
        """
        Configuración interna de Pydantic Settings.

        Define el archivo `.env` como fuente principal de variables de entorno.
        """
        env_file = ".env"

#: Instancia global de la configuración de la aplicación.
#: 
#: Al importarse este módulo, se carga automáticamente el archivo `.env`
#: y se valida que todas las variables necesarias estén presentes.
settings = Settings()
