"""
Router de Autenticación
Endpoints: /auth/register, /auth/login, /auth/me
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
import jwt
from ..schemas.auth import (
    RegisterRequest,
    LoginRequest,
    User,
    UserProfile,
    UserResponse,
    AuthResponse,
    MessageResponse,
    ExistsResponse
)
from ..services.supabase import supabase
from ..services.supabase import supabase_admin
from ..dependencies import get_current_user, get_current_admin
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register( data: RegisterRequest, 
                    current_admin: dict = Depends(get_current_admin)):
    """
    Register new user

    This endpoint allows the sing up of any type of user.
    
    Args:
        data (RegisterRequest) INCLUDES:
            - username (str): Username of the new user (should be unique).
            - password (str): Password.
            - role (str): "teacher" "student" "admin" -> Last one should be rare.

    Raises:
        HTTPException: Username exists or error while creating the user(`400 BAD REQUEST`).
        HTTPException: Unknown exception (`500 INTERNAL SERVER ERROR`).

    Returns:
        User: The user data, without the password.
    """
    try:
        # Create the new user in Supabase Auth
        # The trigger in the database will create the tuple in public.users
        new_user = supabase_admin.auth.admin.create_user({
            "email":  f"{data.username}@tatomaths.local",
            "password": data.password,
            "email_confirm": True,
            "options": {
                "data":{
                    "role": data.role
                    # Add other user metadata for public.users tuple
                }
            }
        })


        # Returns user
        return User(
            id=new_user.user.id,
            username=data.username,
            role=data.role
        )

    except Exception as e:
        # Parse known Supabase errors (duplicate email, etc.)
        error_message = str(e)

        if "duplicate key value violates unique constraint" in error_message or "User already registered" in error_message or "already exists" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username in use"
            )

        # Generic catch-all for any other error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en registro: {error_message}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """
    Log in

    This endpoint allows users to log in with their credentials.
    It returns a JWT token and the user profile data.

    Args:
        data (LoginRequest): Objeto con las credenciales de inicio de sesión:
            - username (str): Nombre de usuario registrado.
            - password (str): Contraseña asociada.

    Raises:
        HTTPException: Si el usuario no existe (`404 NOT FOUND`).
        HTTPException: Si la contraseña es incorrecta (`401 UNAUTHORIZED`).
        HTTPException: Si ocurre un error interno durante la autenticación (`500 INTERNAL SERVER ERROR`).

    Returns:
        AuthResponse: Objeto con el token de acceso y la información del perfil autenticado.
    """
    try:

        # Log in the user
        
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": f"{data.username}@tatomaths.local",
                "password": data.password
            })

            if not auth_response.user or not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="El usuario o la contraseña son incorrectos"
                )
        except Exception as auth_error:
            # Si Supabase devuelve error de autenticación, es contraseña incorrecta
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La contraseña es incorrecta"
            )
            
        
        # Fetch public.users data and then user_profiles
        response_user_public = supabase.table("users")\
            .select("*")\
            .eq("id", auth_response.user.id)\
            .execute()
        
        if not response_user_public.data or len(response_user_public.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User public not found"
            )
            
        response_user_profile = supabase.table("user_profiles")\
            .select("*")\
            .eq("user_id", auth_response.user.id)\
            .execute()

        if response_user_profile.data and len(response_user_profile.data) > 0:
            # User with complete profile
            user = {
                "id": auth_response.user.id,
                "username": auth_response.user.email.split("@")[0],
                "role": response_user_public.data[0]["role"],
                "notes": response_user_profile.data[0].get("notes"),
                "visual_preferences": response_user_profile.data[0].get("visual_preferences"),
                "audio_preferences": response_user_profile.data[0].get("audio_preferences"),
                "accessibility_settings": response_user_profile.data[0].get("accessibility_settings"),
                "game_preferences": response_user_profile.data[0].get("game_preferences"),
            }
            return AuthResponse(
                access_token=auth_response.session.access_token,
                user=UserProfile(**user)
            )
        else:
            # User without profile (teachers(puede tener perfil), admins)
            user = {
                "id": auth_response.user.id,
                "username": auth_response.user.email.split("@")[0],
                "role": response_user_public.data[0]["role"],
            }
            return AuthResponse(
                access_token=auth_response.session.access_token,
                user=User(**user)
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en login: {str(e)}"
        )


@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Obtiene la información del usuario autenticado actual.

    Este endpoint requiere un token JWT válido. Devuelve los datos del perfil
    del usuario actualmente autenticado.

    Args:
        current_user (dict): Diccionario con la información del usuario autenticado,
            obtenido a través de la dependencia `get_current_user`.

    Returns:
        UserProfile: Perfil del usuario autenticado (id, username, email, role, full_name).
    """
    return User(**current_user)



@router.get("/exists/{username}", response_model=ExistsResponse)
async def username_exists(username: str):
    """
    Comprueba si existe un usuario con el username dado en la tabla public.users.

    Busca por la columna `username` en `users` y devuelve { exists: bool }.
    """
    try:
        # Buscamos en la tabla pública `users` por la columna `username`.
        response = supabase_admin.table("users")\
            .select("id")\
            .ilike("username", username)\
            .limit(1)\
            .execute()

        exists = bool(response.data and len(response.data) > 0)
        return ExistsResponse(exists=exists)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking username existence: {str(e)}"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Cierra la sesión del usuario autenticado.

    Este endpoint verifica que el token JWT sea válido y confirma la
    finalización de la sesión. El cierre de sesión real (revocación o eliminación
    del token) se gestiona desde el cliente (frontend).

    Args:
        current_user (dict): Información del usuario autenticado, obtenida mediante
            la dependencia `get_current_user`.

    Returns:
        MessageResponse: Mensaje de confirmación indicando que la sesión se cerró correctamente.
    """
    # En Supabase, el logout se hace desde el cliente
    # Aquí solo confirmamos que el token es válido
    return MessageResponse(message="Sesión cerrada correctamente")