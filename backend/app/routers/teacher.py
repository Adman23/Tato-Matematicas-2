"""
Router de Profesores
Endpoints: /teacher/students, /teacher/all
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
import jwt

from ..services.supabase import supabase
from ..services.supabase import supabase_admin
from ..dependencies import is_auth_current_user, is_admin_current_user
from ..config import settings

router = APIRouter()

DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg"

@router.get("/students", summary="Gets all the students of a teacher")
async def list_students(data:tuple=Depends(is_auth_current_user)):
    """
    Returns a list of all students assigned to the teacher, each one with id, name and photo_url.
    """
    try:
        teacher_id, email = data
        
        # First we get all the groups assigned to the teacher
        resp = supabase_admin.table("teacher_group_relations") \
                    .select("group_id") \
                    .eq("teacher_id", teacher_id) \
                    .execute()

        if not resp.data:
            return []
        
        # Extract the group ids from the response
        group_ids = [record["group_id"] for record in resp.data if record.get("group_id")]
        if not group_ids:
            return []

        # Get all the students in those groups
        st = supabase_admin.table("users") \
                        .select("id, photo_url, group_id") \
                        .in_("group_id", group_ids) \
                        .eq("role", "student") \
                        .execute()
                        
        if not st.data:
            return []      
        
        
        # Get the group names for the groups of the teacher and then map it
        groups_resp = supabase_admin.table("groups") \
                            .select("id, alias") \
                            .in_("id", group_ids) \
                            .execute()
        group_alias = {g["id"]: g["alias"] for g in groups_resp.data}
        
        
        # For each student, get username from auth.users        
        students = []
        for s in  st.data:
            sid = s["id"]
            au = supabase_admin.auth.admin.get_user_by_id(sid)
            print("\n\n", s.get("group_id"), "\n\n")
            students.append({
                "id": sid,
                "username": au.user.email.split("@")[0],
                "photo_url": s.get("photo_url") or DEFAULT_AVATAR,
                "group_id": s.get("group_id"),
                "group_alias": group_alias.get(s.get("group_id"))
            })
                                
        return students

    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting the users"
        )


@router.get("/all", summary="Gets all teachers with photo, username and groups")
async def list_teachers(admin=Depends(is_admin_current_user)):
    """
    List all teachers with groups.

    Get all teachers with their id, username, photo_url and the groups they teach.

    Args:
        admin: The current admin user.

    Raises:
        HTTPException: If there is an error getting the teachers (`500 INTERNAL SERVER ERROR`).

    Returns:
        A list of teachers, each with:
            - id: Teacher's ID.
            - username: Teacher's username (email prefix).
            - photo_url: URL of the teacher's photo.
            - groups: List of groups the teacher teaches, each with id and alias.

    Requires admin authentication.
    """
    try:
        # Get all users with role 'teacher'
        resp = supabase_admin.table("users") \
                    .select("id, photo_url") \
                    .eq("role", "teacher") \
                    .execute()

        if not resp.data:
            return []

        # For each teacher, get id from users table
        teachers = []
        for t in resp.data:
            tid = t.get("id")
            if not tid:
                continue

            # Get username from auth (email prefix)
            try:
                au = supabase_admin.auth.admin.get_user_by_id(tid)
                username = None
                if getattr(au, "user", None) and getattr(au.user, "email", None):
                    username = au.user.email.split("@")[0]
            except Exception:
                username = None

            # Get photo_url or default avatar
            photo = supabase_admin.storage.from_("user_photo").get_public_url(t.get("photo_url")) or DEFAULT_AVATAR

            # Get group relations for this teacher
            rel = supabase_admin.table("teacher_group_relations") \
                        .select("group_id") \
                        .eq("teacher_id", tid) \
                        .execute()

            group_ids = [r["group_id"] for r in (rel.data or []) if r.get("group_id")]
            groups = []
            if group_ids:
                groups_resp = supabase_admin.table("groups") \
                                    .select("id, alias") \
                                    .in_("id", group_ids) \
                                    .execute()
                groups = [{"id": g.get("id"), "alias": g.get("alias")} for g in (groups_resp.data or [])]

            # Append teacher info to the list
            teachers.append({
                "id": tid,
                "username": username,
                "photo_url": photo,
                "groups": groups
            })

        return teachers

    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting the teachers"
        )

    

