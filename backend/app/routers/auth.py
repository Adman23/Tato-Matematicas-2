"""
Router de Autenticación
Endpoints: /auth/register, /auth/login, /auth/me
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
import jwt
from ..config import settings
from supabase import create_client
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
            "user_metadata": {
                "role": data.role,
                "photo_url": data.photo_url,
                # Add other user metadata for public.users tuple
            }
        })

        # Returns user without password
        return User(
            id=new_user.user.id,
            username=data.username,
            role=data.role,
            photo_url=supabase_admin.storage.from_("user_photo").get_public_url(data.photo_url) or None
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


@router.post("/register/group", response_model=Group, status_code=status.HTTP_201_CREATED)
async def register_group(data: Group, current_admin: dict = Depends(get_current_admin)):
    """
    Register new group

    This endpoint allows the creation of a new group.

    Args:
        data (Group): object with the group data:
            - alias (str): Alias of the group (should be unique).

    Raises:
        HTTPException: If there is an error creating the group (`500 INTERNAL SERVER ERROR`).

    Returns:
        Group: Information about the created group.
    """
    try:
        # Create the new group in the database
        # `data` is a Pydantic model instance; convert to dict so it's JSON-serializable
        try:
            payload = data.dict(exclude_none=True)
        except Exception as e:
            # Payload conversion failed -> client error
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Invalid group payload: {str(e)}")

        try:
            new_group = supabase_admin.table("groups").insert(payload).execute()
        except Exception as e:
            # Error from Supabase client or network
            print("Supabase insert error:", repr(e))
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Error creating group in database: {str(e)}")

        if not new_group.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error creating group"
            )

        return new_group.data[0]

    except HTTPException:
        # Re-raise known HTTP exceptions
        raise
    except Exception as e:
        print("Register group error:", repr(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error registering group: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """
    Log in

    This endpoint allows users to log in with their credentials.
    It returns a JWT token and the user profile data.

    Args:
        data (LoginRequest): Object with login credentials:
            - username (str): Registered username.
            - password (str): Associated password.

    Raises:
        HTTPException: If the user does not exist (`404 NOT FOUND`).
        HTTPException: If the password is incorrect (`401 UNAUTHORIZED`).
        HTTPException: If there is an internal error during authentication (`500 INTERNAL SERVER ERROR`).

    Returns:
        AuthResponse: Object with the access token and the authenticated profile information.
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
                "photo_url": supabase_admin.storage.from_("user_photo")\
                                .get_public_url(response_user_public.data[0].get("photo_url")) or None,
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
                "photo_url": response_user_public.data[0].get("photo_url"),
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
    Check username existence.

    Check if exists a user with the given username in auth.users. Searches by
    email (the part before the @) and returns { exists: bool }.

    Args:
        username (str): Username to check.

    Raises:
        HTTPException: If there is an error checking username existence (`500 INTERNAL SERVER ERROR`).

    Returns:
        ExistsResponse: Object with `exists: bool` indicating if the username exists.
    """
    try:

        # Use the admin API to list auth users and check for the email that
        # corresponds to the provided username (the part before the @)
        try:
            users = supabase_admin.auth.admin.list_users(page=1, per_page=1000)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching auth users: {str(e)}"
            )

        exists = False
        if users:
            for u in users:
                # Get email attribute safely
                try:
                    user_email = getattr(u, "email", None)
                except Exception:
                    user_email = None

                if not user_email and isinstance(u, dict):
                    user_email = u.get("email")

                if not user_email:
                    continue

                # Derive username from the auth email (part before @)
                try:
                    username_from_email = user_email.split("@")[0]
                except Exception:
                    continue

                # Compare case-insensitively
                if username_from_email and username_from_email.lower() == username.lower():
                    exists = True
                    break

        return ExistsResponse(exists=exists)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking username existence: {str(e)}"
        )


@router.get("/groups/exists/{groupId}", response_model=ExistsResponse)
async def group_exists(groupId: str):
    """
    Check group existence.

    Check if exists a group with the given id in public.groups.Searches by id in public.groups and returns { exists: bool }.

    Args:
        groupId (str): Group ID to check.

    Raises:
        HTTPException: If there is an error checking group existence (`500 INTERNAL SERVER ERROR`).
    
    Returns:
        ExistsResponse: Object with `exists: bool` indicating if the group exists.
    """
    try:

        # Use the admin API to list groups and check for the id that
        # corresponds to the provided groupId
        try:
            resp = supabase_admin.table("groups").select("*").execute()

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching groups: {str(e)}"
            )

        # Normalize rows (Supabase client returns object with .data)
        rows = getattr(resp, 'data', None) or resp or []

        exists = False


        for g in rows:
            try:
                gid = getattr(g, 'alias', None)
            except Exception:
                gid = None

            if not gid and isinstance(g, dict):
                gid = g.get('alias')

            # Compare as strings to avoid type mismatch (int vs str)
            if gid is not None and str(gid) == str(groupId):
                exists = True
                break

        return ExistsResponse(exists=exists)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking group existence: {str(e)}"
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
                "photo_url": response_user.data[0].get("photo_url"),
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
                "photo_url": response_user.data[0].get("photo_url"),
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