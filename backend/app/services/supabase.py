"""
Cliente de Supabase.

Este módulo inicializa y expone una instancia del cliente de Supabase que
permite interactuar con la base de datos y los servicios asociados.

El cliente se crea utilizando las credenciales del rol de servicio
(`SERVICE_ROLE`), lo que le otorga permisos completos en la base de datos.
 Por seguridad, este cliente solo debe utilizarse en el backend del servidor,
ya que ignora las políticas de Row-Level Security (RLS) de Supabase.
"""
from supabase import create_client, Client
from ..config import settings

#: Instancia global del cliente de Supabase.
#: 
#: Se inicializa con el rol de servicio (`SERVICE_ROLE`), lo que permite
#: realizar operaciones administrativas y saltar las políticas RLS.
#: 
#: Attributes:
#:     settings.SUPABASE_URL (str): URL del proyecto Supabase.
#:     settings.SUPABASE_SERVICE_ROLE (str): Clave de servicio con permisos elevados.
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE
)
