"""
Dependencias de autenticación para FastAPI.

Este módulo define las dependencias que se utilizan para autenticar y autorizar
a los usuarios dentro de la aplicación. Se incluyen funciones que validan los
tokens JWT

Las dependencias se integran en los endpoints mediante el parámetro
`Depends()` de FastAPI.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import traceback
from .config import settings
from .services.supabase import supabase, supabase_admin


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
        dict: Diccionario con los datos del usuario autenticado (id, email, rol).
    """
    token = credentials.credentials
    
    # Modo desarrollo: devolver usuario fake
    if settings.DEV_MODE:
        return {
            "id": "dev-user-id",
            "username": "dev@tatomaths.com",
            "role": "admin"
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
        responseAuth = supabase_admin.auth.admin.get_user_by_id(user_id)
        
        # Validar si existe el usuario en Auth
        if not responseAuth or not responseAuth.user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        responsePublic = supabase_admin.table("users").select("*").eq("id", user_id).execute()

        # Validar si existe en la tabla pública
        if not responsePublic.data or len(responsePublic.data) == 0:
            #print(responseAuth)
            #print(responsePublic)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User public not found"
            )
        
        return  {
                "id": responseAuth.user.id,
                "username": responseAuth.user.email.split("@")[0],
                "role": responsePublic.data[0]["role"],
                "photo_url": supabase_admin.storage.from_("user_photo")\
                                .get_public_url(responsePublic.data[0].get("photo_url")) or None
                }
        
        
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or invalid token"
        )
    except Exception as e:
        # Print full traceback to help debugging in development
        print("Error in get_current_user:", str(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifiying the token: {str(e)}"
        )


async def get_current_admin(current_user: dict = Depends(get_current_user)):
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
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden acceder"
        )
    return current_user