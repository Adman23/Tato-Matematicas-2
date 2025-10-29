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
    Group,
    StudentBasicInfo,
    StudentLoginRequest,
    StudentAuthResponse,
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


# === STUDENT LOGIN ENDPOINTS ===

@router.get("/groups", response_model=list[Group])
async def get_groups():
    """
    Get all available groups for student login

    Returns:
        list[Group]: List of all groups with id and alias
    """
    try:
        response = supabase_admin.table("groups").select("*").execute()

        if not response.data:
            return []

        return [Group(**group) for group in response.data]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching groups: {str(e)}"
        )


@router.get("/groups/{group_id}/students", response_model=list[StudentBasicInfo])
async def get_students_by_group(group_id: int):
    """
    Get all students from a specific group

    Returns:
        list[StudentBasicInfo]: List of students with id, username (extracted from email), and photo_url
    """
    try:
        # Get students from public.users (id and photo_url)
        resp = supabase_admin.table("users") \
                             .select("id, photo_url") \
                             .eq("group_id", group_id) \
                             .eq("role", "student") \
                             .execute()

        if not resp.data:
            return []

        # Get username from auth.users email for each student
        students = []
        for user in resp.data:
            try:
                # Get email from auth.users
                auth_user = supabase_admin.auth.admin.get_user_by_id(user["id"])
                # Extract username from email (before @)
                username = auth_user.user.email.split("@")[0]

                students.append({
                    "id": user["id"],
                    "username": username,
                    "photo_url": user.get("photo_url")
                })
            except Exception as user_error:
                # If we can't get auth user, skip this student
                print(f"Warning: Could not get username for user {user['id']}: {user_error}")
                continue

        return students

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching students: {str(e)}"
        )
"""

@router.get("/groups/{group_id}/students", response_model=list[StudentBasicInfo])
async def get_students_by_group(group_id: int):
    try:
        resp = supabase_admin.table("users") \
                             .select("id, username, photo_url") \
                             .eq("group_id", group_id) \
                             .execute()
        return resp.data or []
    except Exception as e:
        raise HTTPException(500, detail=f"Error fetching students: {e}")
"""



@router.post("/student/login", response_model=StudentAuthResponse)
async def login_student(data: StudentLoginRequest):
    """
    Student login with group_id, username and password (pictogram sequence)

    Args:
        data (StudentLoginRequest): Login credentials
            - group_id: UUID of the student's group
            - username: Student's username
            - password: Pictogram sequence as string (e.g., "perro-gato-león")

    Returns:
        StudentAuthResponse: Access token and student profile
    """
    try:
        # Use unified login endpoint
        auth_response = supabase.auth.sign_in_with_password({
            "email": f"{data.username}@tatomaths.local",
            "password": data.password
        })

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas"
            )

        # Verify the user is a student and belongs to the specified group
        response_user = supabase.table("users")\
            .select("*")\
            .eq("id", auth_response.user.id)\
            .eq("role", "student")\
            .eq("group_id", data.group_id)\
            .execute()

        if not response_user.data or len(response_user.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder con este grupo"
            )

        # Get student profile
        response_profile = supabase.table("user_profiles")\
            .select("*")\
            .eq("user_id", auth_response.user.id)\
            .execute()

        if response_profile.data and len(response_profile.data) > 0:
            student_data = {
                "id": auth_response.user.id,
                "username": data.username,
                "role": "student",
                "notes": response_profile.data[0].get("notes"),
                "visual_preferences": response_profile.data[0].get("visual_preferences"),
                "audio_preferences": response_profile.data[0].get("audio_preferences"),
                "accessibility_settings": response_profile.data[0].get("accessibility_settings"),
                "game_preferences": response_profile.data[0].get("game_preferences"),
            }
            return StudentAuthResponse(
                access_token=auth_response.session.access_token,
                student=UserProfile(**student_data)
            )
        else:
            # Student without profile
            student_data = {
                "id": auth_response.user.id,
                "username": data.username,
                "role": "student",
            }
            return StudentAuthResponse(
                access_token=auth_response.session.access_token,
                student=UserProfile(**student_data)
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en login de estudiante: {str(e)}"
        )