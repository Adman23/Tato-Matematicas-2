"""
Auth schemas

Este módulo define los modelos de petición y respuesta utilizados en los
endpoints de autenticación y gestión de sesiones. Los modelos están
basados en Pydantic e incluyen validaciones y ejemplos para la
generación automática de la documentación (OpenAPI/Swagger).

"""
from pydantic import BaseModel, Field


# === REQUEST MODELS ===

class RegisterRequest(BaseModel):
    """
    Model with the needed data to register a new user (can be student, tutor or even admin).
    """
    username: str = Field(..., min_length=3, pattern="^[A-Za-z0-9_-]+$")
    password: str
    role: str = "student"  # Default is student

    class Config:
        json_schema_extra = {
            "example": {
                "username": "username",
                "password": "password123", # Should this be the hashed password?
                "role": "tutor"
            }
        }


class LoginRequest(BaseModel):
    """
    Credentials for login
    
    We use the username (email in supabase) and password
    
    """
    username: str = Field(..., min_length=3)
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin@example.com", # Currently we can enter emails as usernames
                "password": "password123"
            }
        }



# === RESPONSE MODELS ===

class User(BaseModel):
    """
    Users data model
    """
    id: str
    username: str
    role: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
    
class UserResponse(BaseModel):
    """
    User response model
    """
    user: User

class MessageResponse(BaseModel):
    """
    Generic response
    """
    message: str