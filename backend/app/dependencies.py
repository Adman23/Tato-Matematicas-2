"""
Dependencies para FastAPI
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from .config import settings
from .services.supabase import supabase

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Obtiene el usuario actual desde el token JWT de Supabase
    """
    token = credentials.credentials
    
    # Modo desarrollo: devolver usuario fake
    if settings.DEV_MODE:
        return {
            "id": "dev-user-id",
            "email": "dev@tatomaths.com",
            "role": "admin",
            "full_name": "Admin Dev"
        }
    
    try:
        # Verificar token con Supabase JWT secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Obtener perfil del usuario desde la BD
        response = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return response.data[0]
        
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar token: {str(e)}"
        )


async def get_current_admin(
    current_user: dict = Depends(get_current_user)
):
    """
    Verifica que el usuario actual sea admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden acceder"
        )
    return current_user


async def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Obtiene el estudiante actual desde el token JWT
    """
    token = credentials.credentials

    # Modo desarrollo: devolver estudiante fake
    if settings.DEV_MODE:
        return {
            "id": "dev-student-id",
            "username": "estudiante_dev",
            "full_name": "Estudiante Dev"
        }

    try:
        # Verificar token JWT con el secreto de la aplicación
        payload = jwt.decode(
            token,
            settings.APP_JWT_SECRET,
            algorithms=["HS256"],
            audience=settings.APP_JWT_AUDIENCE
        )

        # Verificar que sea un token de estudiante
        if payload.get("type") != "student":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token no válido para estudiante"
            )

        student_id = payload.get("sub")
        if not student_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )

        # Obtener datos del estudiante desde la BD
        response = supabase.table("students").select("*").eq("id", student_id).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Estudiante no encontrado"
            )

        return response.data[0]

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al verificar token de estudiante: {str(e)}"
        )
