"""
Dependencias de autenticación para FastAPI.

Este módulo define las dependencias que se utilizan para autenticar y autorizar
a los usuarios dentro de la aplicación. Se incluyen funciones que validan los
tokens JWT tanto de administradores/tutores (emitidos por Supabase) como de
estudiantes (emitidos por la propia aplicación).

Las dependencias se integran en los endpoints mediante el parámetro
`Depends()` de FastAPI.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from .config import settings
from .services.supabase import supabase

#: Dependencia de seguridad HTTP Bearer utilizada para extraer el token JWT
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Obtiene la información del usuario autenticado a partir del token JWT de Supabase.

    Esta función valida el token JWT emitido por Supabase Auth y recupera el
    perfil del usuario desde la tabla `user_profiles`. Si el modo desarrollo
    está activado, devuelve un usuario de prueba (fake).

    Args:
        credentials (HTTPAuthorizationCredentials): Token de autorización HTTP
            enviado en la cabecera `Authorization: Bearer <token>`.

    Raises:
        HTTPException: Si el token es inválido o no contiene un ID de usuario (`401 UNAUTHORIZED`).
        HTTPException: Si el usuario no se encuentra en la base de datos (`404 NOT FOUND`).
        HTTPException: Si ocurre un error interno al verificar el token (`500 INTERNAL SERVER ERROR`).

    Returns:
        dict: Diccionario con los datos del usuario autenticado (id, email, rol, full_name).
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
    Verifica que el usuario autenticado tenga rol de administrador.

    Esta dependencia se utiliza en endpoints que requieren permisos elevados.
    Si el usuario no tiene el rol `admin`, se lanza una excepción HTTP 403.

    Args:
        current_user (dict): Datos del usuario autenticado obtenidos desde `get_current_user`.

    Raises:
        HTTPException: Si el usuario no es administrador (`403 FORBIDDEN`).

    Returns:
        dict: Datos del usuario autenticado con rol de administrador.
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
    Obtiene la información del estudiante autenticado a partir del token JWT de la aplicación.

    Esta función valida el token JWT emitido por la propia aplicación (no por Supabase)
    para autenticar a los estudiantes. Si el modo desarrollo está activado,
    devuelve un estudiante de prueba (fake).

    Args:
        credentials (HTTPAuthorizationCredentials): Token JWT del estudiante enviado
            en la cabecera `Authorization: Bearer <token>`.

    Raises:
        HTTPException: Si el token es inválido o no corresponde a un estudiante (`401 UNAUTHORIZED`).
        HTTPException: Si el estudiante no se encuentra en la base de datos (`404 NOT FOUND`).
        HTTPException: Si ocurre un error durante la verificación (`500 INTERNAL SERVER ERROR`).

    Returns:
        dict: Datos del estudiante autenticado (id, username, full_name, etc.).
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
