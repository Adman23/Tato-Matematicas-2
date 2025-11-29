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

# !! EDITED 1.2.0
# -> Now its called "is_auth_current_user" instead of get_current_user
# -> Now it only verifies if the current user is authenticated based on the token
# -> This way its faster and returns the id to use it in is_admin_current_user
async def is_auth_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
    """
    Returns the id of the current authenticated user in case the token is valid

    Args:
        credentials (HTTPAuthorizationCredentials): Auth token in `Authorization: Bearer <token>`.

    Raises:
        HTTPException: If the token is invalid (`401 UNAUTHORIZED`).
        HTTPException: Internal error verifying the token (`500 INTERNAL SERVER ERROR`).

    Returns:
        user_id: id associated to the token
        email: email associated to the id
    """
    token = credentials.credentials
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
                detail="Invalid token"
            )
            
            
        
        response = supabase_admin.auth.admin.get_user_by_id(user_id) 
        if not response.user:
            raise HTTPException(
                status_code = status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        """
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
        """
        
        email = response.user.email or None
        return (user_id,email)
        
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or invalid token"
        )
    except Exception as e:
        print("Error in is_auth_current_user:", str(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unidentified error verifying the token: {str(e)}"
        )


async def is_admin_current_user(data: tuple = Depends(is_auth_current_user)):
    """
    Verifies if the current authenticated user is an admin.
    For endpoints that require admin access, HTTP 403 exception in case the role isn't admin
    
    Args:
        user_id (str): obtained with is_auth_current_user

    Raises:
        HTTPException: User is not admin (`403 FORBIDDEN`).

    Returns:
        user_id: id associated to the token
    """
    user_id, email = data
    role = (supabase_admin.table("users").select("role").eq("id", user_id).execute()).data[0].get("role")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires admin access"
        )
    return (user_id, email)