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
    StudentLoginRequest,
    AuthResponse,
    StudentAuthResponse,
    UserProfile,
    MessageResponse
)
from ..services.supabase import supabase
from ..dependencies import get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    """
    Registra un nuevo usuario (admin o tutor).

    Este endpoint permite crear un nuevo usuario en el sistema.
    - Solo un administrador puede crear otros administradores (validación en frontend).
    - Crea un usuario en Supabase Auth.
    - Inserta un perfil asociado en la tabla `user_profiles` con un nombre de usuario único.

    Args:
        data (RegisterRequest): Objeto con los datos de registro, incluyendo:
            - email (str): Correo electrónico del usuario.
            - password (str): Contraseña del usuario.
            - username (str): Nombre de usuario único.
            - role (str): Rol asignado ("admin" o "tutor").
            - full_name (str): Nombre completo del usuario.

    Raises:
        HTTPException: Si el nombre de usuario ya existe (`400 BAD REQUEST`).
        HTTPException: Si el email ya está registrado o no se puede crear el usuario (`400 BAD REQUEST`).
        HTTPException: Si ocurre un error inesperado durante el registro (`500 INTERNAL SERVER ERROR`).

    Returns:
        AuthResponse: Objeto con el token de acceso y el perfil de usuario creado.
    """
    try:
        # 1. Verificar que el username no esté en uso
        username_check = supabase.table("user_profiles")\
            .select("username")\
            .eq("username", data.username)\
            .execute()

        if username_check.data and len(username_check.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )

        # 2. Crear usuario en Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "username": data.username,
                    "role": data.role,
                    "full_name": data.full_name
                }
            }
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo crear el usuario. El email podría estar en uso."
            )

        # 3. Crear perfil en user_profiles
        profile_data = {
            "id": auth_response.user.id,
            "username": data.username,
            "email": data.email,
            "role": data.role,
            "full_name": data.full_name
        }

        supabase.table("user_profiles").insert(profile_data).execute()

        # 4. Retornar tokens y perfil
        return AuthResponse(
            access_token=auth_response.session.access_token,
            user=UserProfile(**profile_data)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en registro: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """
    Inicia sesión para administradores y tutores mediante username y contraseña.

    El endpoint valida las credenciales del usuario utilizando Supabase Auth
    y devuelve un token de autenticación junto con el perfil del usuario.

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
        # 1. Buscar usuario por username en user_profiles
        profile_response = supabase.table("user_profiles")\
            .select("*")\
            .eq("username", data.username)\
            .execute()

        if not profile_response.data or len(profile_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El usuario no existe"
            )

        user_profile = profile_response.data[0]

        # 2. Autenticar con Supabase usando el email del perfil
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": user_profile["email"],
                "password": data.password
            })

            if not auth_response.user or not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="La contraseña es incorrecta"
                )
        except Exception as auth_error:
            # Si Supabase devuelve error de autenticación, es contraseña incorrecta
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="La contraseña es incorrecta"
            )

        # 3. Retornar tokens y perfil
        return AuthResponse(
            access_token=auth_response.session.access_token,
            user=UserProfile(**user_profile)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en login: {str(e)}"
        )


@router.get("/me", response_model=UserProfile)
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
    return UserProfile(**current_user)


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


@router.post("/student", response_model=StudentAuthResponse)
async def student_login(data: StudentLoginRequest):
    """
    Inicia sesión de un estudiante utilizando una secuencia de pictogramas.

    Este endpoint permite a los estudiantes autenticarse mediante una secuencia
    de pictogramas almacenada en la base de datos. Si la secuencia coincide con
    la registrada en el sistema, se genera un token JWT válido por 24 horas.

    Args:
        data (StudentLoginRequest): Objeto con los datos de inicio de sesión, incluyendo:
            - pictos (list[str]): Secuencia de pictogramas seleccionados por el estudiante.

    Raises:
        HTTPException: Si no se encuentra ningún estudiante con la secuencia proporcionada (`401 UNAUTHORIZED`).
        HTTPException: Si ocurre un error inesperado durante la autenticación (`500 INTERNAL SERVER ERROR`).

    Returns:
        StudentAuthResponse: Objeto con el token JWT generado y los datos del estudiante autenticado.
    """
    try:
        # Obtener todos los estudiantes y comparar en Python
        # (PostgREST no soporta comparación de arrays directamente)
        response = supabase.table("students")\
            .select("id, username, full_name, photo_url, pictogram_login_sequence")\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Secuencia de pictogramas incorrecta"
            )

        # Buscar el estudiante cuya secuencia coincida
        student = None
        for s in response.data:
            if s.get('pictogram_login_sequence') == data.pictos:
                student = s
                break

        if not student:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Secuencia de pictogramas incorrecta"
            )

        # Generar token JWT para el estudiante
        token_payload = {
            "sub": student['id'],  # Subject: ID del estudiante
            "type": "student",     # Tipo de usuario
            "aud": settings.APP_JWT_AUDIENCE,  # Audience
            "iss": settings.APP_JWT_ISSUER,    # Issuer
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),  # Expira en 24 horas
            "iat": datetime.now(timezone.utc)  # Issued at
        }

        token = jwt.encode(
            token_payload,
            settings.APP_JWT_SECRET,
            algorithm="HS256"
        )

        return StudentAuthResponse(
            token=token,
            student_id=student['id'],
            student={
                "id": student['id'],
                "username": student['username'],
                "full_name": student['full_name'],
                "photo_url": student.get('photo_url')
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en login de estudiante: {str(e)}"
        )
