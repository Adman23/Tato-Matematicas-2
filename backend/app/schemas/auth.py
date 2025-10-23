"""
Schemas de autenticación.

Este módulo define los modelos de petición y respuesta utilizados en los
endpoints de autenticación y gestión de sesiones. Los modelos están
basados en Pydantic e incluyen validaciones y ejemplos para la
generación automática de la documentación (OpenAPI/Swagger).
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List


# === REQUEST MODELS ===

class RegisterRequest(BaseModel):
    """
    Datos necesarios para registrar un nuevo usuario.

    Incluye credenciales básicas, nombre completo y rol del usuario.
    El `username` debe ser único y cumplir el patrón permitido.
    """
    username: str = Field(..., min_length=3, pattern="^[A-Za-z0-9_-]+$")
    email: EmailStr
    password: str
    full_name: str
    role: str = "tutor"  # admin o tutor

    class Config:
        json_schema_extra = {
            "example": {
                "username": "juan_perez",
                "email": "tutor@example.com",
                "password": "password123",
                "full_name": "Juan Pérez",
                "role": "tutor"
            }
        }


class LoginRequest(BaseModel):
    """
    Credenciales para iniciar sesión de administradores o tutores.

    Se autentica por `username` y `password`.
    """
    username: str = Field(..., min_length=3)
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "password123"
            }
        }


class StudentLoginRequest(BaseModel):
    """
    Petición de login para estudiantes basada en una secuencia de pictogramas.

    La autenticación se realiza comparando la secuencia enviada con la
    almacenada para el estudiante.
    """
    pictos: List[str] = Field(..., min_length=1, max_length=10)

    class Config:
        json_schema_extra = {
            "example": {
                "pictos": ["perro", "gato", "tortuga"]
            }
        }


# === RESPONSE MODELS ===

class UserProfile(BaseModel):
    """
    Perfil básico de usuario.

    Representa los datos principales vinculados a un usuario de la plataforma.
    """
    id: str
    username: str
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class StudentAuthResponse(BaseModel):
    """
    Respuesta de autenticación para estudiantes.

    Devuelve el token JWT y datos básicos del estudiante autenticado.
    """
    token: str
    student_id: str
    student: dict  # Datos básicos del estudiante


class MessageResponse(BaseModel):
    """
    Respuesta genérica con un mensaje informativo.
    """
    message: str