"""
Cliente de Supabase
"""
from supabase import create_client, Client
from ..config import settings

# Cliente de Supabase usando SERVICE_ROLE (permisos completos, ignora RLS)
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE
)
