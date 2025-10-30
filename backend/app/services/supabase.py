"""
Cliente de Supabase.

Este módulo inicializa y expone dos instancias del cliente de Supabase:
- `supabase`: para operaciones normales (respeta RLS).
- `supabase_admin`: para operaciones administrativas (ignora RLS).

Por seguridad, `supabase_admin` solo debe usarse en endpoints que lo requieran
explícitamente (ej. creación de usuarios por admins).
"""

from supabase import create_client
from ..config import settings

# Cliente normal (con ANON_KEY) → respeta RLS
# Usado en la mayoría de endpoints (login, /me, etc.)
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY  # ← Cambia a ANON_KEY
)

# Cliente de administración (con SERVICE_ROLE) → ignora RLS
# Usado solo en endpoints de administración (ej. /admin/register)
supabase_admin = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE
)