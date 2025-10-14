"""
Schemas de autenticación
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List


# === REQUEST MODELS ===

class RegisterRequest(BaseModel):
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
    """Login de estudiante con secuencia de pictogramas"""
    pictos: List[str] = Field(..., min_length=1, max_length=10)

    class Config:
        json_schema_extra = {
            "example": {
                "pictos": ["🐶", "🐱", "🐸"]
            }
        }


# === RESPONSE MODELS ===

class UserProfile(BaseModel):
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
    """Respuesta de login de estudiante"""
    token: str
    student_id: str
    student: dict  # Datos básicos del estudiante


class MessageResponse(BaseModel):
    message: str
