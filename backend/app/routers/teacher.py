"""
Router de Profesores
Endpoints: /teacher/students
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
import jwt

from ..services.supabase import supabase
from ..services.supabase import supabase_admin
from ..dependencies import get_current_user, get_current_admin
from ..config import settings

router = APIRouter()



@router.get("/students", summary="Gets all the students of a teacher")
async def list_students(teacher=Depends(get_current_user)):
    """
    Returns a list of all students assigned to the teacher, each one with id, name and photo_url.
    """
    try:
        # First we get all the groups assigned to the teacher
        resp = supabase_admin.table("teacher_group_relations") \
                    .select("group_id") \
                    .eq("teacher_id", teacher['id']) \
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
                "photo_url": s.get("photo_url") or None,
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