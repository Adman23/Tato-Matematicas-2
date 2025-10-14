"""
Router de Autenticación
Endpoints: /auth/register, /auth/login, /auth/me
"""
from fastapi import APIRouter, HTTPException, status, Depends
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

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    """
    Registrar un nuevo usuario (admin o tutor).

    - Solo admin puede crear otros admins (validar en frontend)
    - Crea usuario en Supabase Auth
    - Crea perfil en user_profiles con username único
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
    Login para admin y tutores con username/password.

    Criterios de aceptación:
    - Si el usuario no existe: "El usuario no existe"
    - Si la contraseña es incorrecta: "La contraseña es incorrecta"
    - Si es correcto: redireccionar a la página principal
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
    Obtener información del usuario actual (requiere autenticación).
    """
    return UserProfile(**current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Cerrar sesión (el frontend debe eliminar el token).
    """
    # En Supabase, el logout se hace desde el cliente
    # Aquí solo confirmamos que el token es válido
    return MessageResponse(message="Sesión cerrada correctamente")


@router.post("/student", response_model=StudentAuthResponse)
async def student_login(data: StudentLoginRequest):
    """
    Login de estudiante con secuencia de pictogramas.

    - Busca estudiante cuya secuencia de pictogramas coincida
    - Retorna token temporal y datos del estudiante
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

        # Generar token simple (en producción usarías JWT)
        # Por ahora usamos el ID del estudiante como token
        token = f"student_{student['id']}"

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
