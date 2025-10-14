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
