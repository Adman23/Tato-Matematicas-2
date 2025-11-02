"""
Router de Estudiantes
Endpoints: /student/all
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
import jwt

from ..services.supabase import supabase
from ..services.supabase import supabase_admin
from ..dependencies import get_current_user, get_current_admin
from ..config import settings

router = APIRouter()

DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg"

@router.get("/all", summary="Gets all students with photo, username and group")
async def list_students(admin=Depends(get_current_admin)):
    """
    Returns a list of all students, each one with id, username, photo_url and their
    single associated group as an object { id, alias } (or null if none).
    """
    try:
        # Get all users with role 'students'
        resp = supabase_admin.table("users") \
                    .select("id, photo_url, group_id") \
                    .eq("role", "student") \
                    .order("group_id") \
                    .execute()

        if not resp.data:
            return []

        students = []
        for s in resp.data:
            sid = s.get("id")
            if not sid:
                continue

            # Get username from auth (email prefix)
            try:
                au = supabase_admin.auth.admin.get_user_by_id(sid)
                username = None
                if getattr(au, "user", None) and getattr(au.user, "email", None):
                    username = au.user.email.split("@")[0]
            except Exception:
                username = None

            photo = s.get("photo_url") or DEFAULT_AVATAR

            # Resolve single group for the student (group_id may be None)
            group = None
            group_id = s.get("group_id")
            if group_id:
                gresp = supabase_admin.table("groups") \
                            .select("id, alias") \
                            .eq("id", group_id) \
                            .execute()
                            
                if gresp.data and len(gresp.data) > 0:
                    g = gresp.data[0]
                    group = {"id": g.get("id"), "alias": g.get("alias")}

            students.append({
                "id": sid,
                "username": username,
                "photo_url": photo,
                "group": group
            })

        return students

    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting the students"
        )

    

