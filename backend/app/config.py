"""
Configuración de la aplicación
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
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
        env_file = ".env"


settings = Settings()
