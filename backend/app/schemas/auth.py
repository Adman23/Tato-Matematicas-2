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
    photo_url: str | None = None  # Optional photo URL, it has to be uploaded previously to a storage

    class Config:
        json_schema_extra = {
            "example": {
                "username": "username",
                "password": "password123", 
                "role": "tutor",
                "photo_url": "https://example.com/photo.jpg"
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
                "username": "admin", # Currently we can enter emails as usernames
                "password": "admin123"
            }
        }



# === RESPONSE MODELS ===

class User(BaseModel):
    """
    Users data model (basic info from public.users and auth.users)
    """
    id: str
    username: str
    role: str
    photo_url: str | None = None

    class Config:
        from_attributes = True


class UserProfile(User):
    """
    Complete user profile including preferences from user_profiles table
    """
    notes: str | None = None
    visual_preferences: dict | None = None
    audio_preferences: dict | None = None
    accessibility_settings: dict | None = None
    game_preferences: dict | None = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User | UserProfile  # Can be basic User or full UserProfile
    
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


# === STUDENT LOGIN MODELS ===

class Group(BaseModel):
    """
    Group data model
    """
    # id is optional for creation (DB will usually generate it). Keep it optional so
    # Pydantic doesn't raise 422 when the client POSTs only the alias.
    id: int | None = None
    alias: str

    class Config:
        from_attributes = True


class StudentBasicInfo(BaseModel):
    """
    Basic student information for selection
    """
    id: str
    username: str
    photo_url: str | None = None

    class Config:
        from_attributes = True


class StudentLoginRequest(BaseModel):
    """
    Student login request with group_id, username and password (pictogram sequence)
    Password format: "perro-gato-león"
    """
    group_id: str
    username: str
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "group_id": "group-uuid",
                "username": "student1",
                "password": "perro-gato-león"
            }
        }


class StudentAuthResponse(BaseModel):
    """
    Student authentication response
    """
    access_token: str
    token_type: str = "bearer"
    student: UserProfile

    class Config:
        from_attributes = True
class ExistsResponse(BaseModel):
    """
    Response for username existence checks
    """
    exists: bool
