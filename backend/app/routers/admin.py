from fastapi import APIRouter, HTTPException, status
from ..services.supabase import supabase
from ..services.supabase import supabase_admin
router = APIRouter()

DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg"

@router.get("/teachers", summary="Obtener todos los profesores")
async def list_teachers():
    """
    Devuelve todos los usuarios con rol 'teacher' combinados con sus perfiles.
    """
    try:
        # Obtener todos los usuarios con rol 'teacher'

        resp = supabase_admin.table("users") \
                             .select("id, photo_url") \
                             .eq("role", "teacher") \
                             .execute()

        if not resp.data:
            return []

        teachers = []

        # Para cada usuario, buscar su perfil en user_profiles
        for user in resp.data:

            try:
                # Get email from auth.users
                auth_user = supabase_admin.auth.admin.get_user_by_id(user["id"])
                # Extract username from email (before @)
                username = auth_user.user.email.split("@")[0]

                teachers.append({
                    "id": user["id"],
                    "username": username,
                    "photo_url": user.get("photo_url") or DEFAULT_AVATAR
                })
            except Exception as user_error:
                # If we can't get auth user, skip this student
                print(f"Warning: Could not get username for user {user['id']}: {user_error}")
                continue
        return teachers

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener los profesores: {str(e)}"
        )
    
@router.get("/students", summary="Obtener todos los alumnos")
async def list_students():
    """
    Devuelve todos los usuarios con rol 'teacher' combinados con sus perfiles.
    """
    try:
        # Obtener todos los usuarios con rol 'student'

        resp = supabase_admin.table("users") \
                             .select("id, photo_url") \
                             .eq("role", "student") \
                             .execute()

        if not resp.data:
            return []

        students = []

        # Para cada usuario, buscar su perfil en user_profiles
        for user in resp.data:

            try:
                # Get email from auth.users
                auth_user = supabase_admin.auth.admin.get_user_by_id(user["id"])
                # Extract username from email (before @)
                username = auth_user.user.email.split("@")[0]

                students.append({
                    "id": user["id"],
                    "username": username,
                    "photo_url": user.get("photo_url") or DEFAULT_AVATAR
                })
            except Exception as user_error:
                # If we can't get auth user, skip this student
                print(f"Warning: Could not get username for user {user['id']}: {user_error}")
                continue
        return students

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener los estudiantes: {str(e)}"
        )