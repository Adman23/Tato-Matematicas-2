"""
Router de Estudiantes
Endpoints: /student/all
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


@router.get("/all", summary="Gets all students with photo, username and group")
async def list_students(admin=Depends(is_admin_current_user)):
    """
    List all students with groups.

    Returns a list of all students with their id, username, photo_url and group info.

    Args:
        admin: The current admin user.

    Raises:
        HTTPException: If there is an error getting the students (`500 INTERNAL SERVER ERROR`).

    Returns:
        A list of students with their id, username, photo_url and group info.

    Requires admin authentication.
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

        # For each student, get id from users table
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

            # Get photo_url or default avatar
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

            # Append student info to the list
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
        
@router.get("/student", summary="Gets all the info of a specific student")
async def get_student(student_id: str):
    """
    Get all configuration and related information of a specific student.

    This endpoint returns the complete data of a student, including their
    basic info (id, username, photo, group) and related data from other
    tables such as `user_profiles`, `reinforcement_messages`, and 
    `game_configurations`.

    Args:
        student_id (str): The unique identifier (UUID) of the student.

    Raises:
        HTTPException:
            - 404 NOT FOUND: If the student or their authentication data 
                cannot be found.
            - 500 INTERNAL SERVER ERROR: If an unexpected error occurs 
                while retrieving the student data.

    Returns:
        dict: A dictionary containing:
            - id (str): Student ID.
            - username (str): Username derived from email prefix.
            - photo_url (str): Public photo URL (or default avatar if missing).
            - group_id (str | None): ID of the group the student belongs to.
            - role (str): Always "student".
            - user_profile (dict): One-to-one relation data from `user_profiles`.
            - game_configuration (dict): One-to-one relation data from `game_configurations`.
            - reinforcement_messages (list): One-to-many relation data from `reinforcement_messages`.

    Requires admin privileges to access.
    """
    try:
        # Get the public user using the id
        # todo needs to complete the info from the other tables.
        # The structure should be like: "id": .., "username": .., "photo_url": .., "group_id": ..,
        # "user_profiles": [..] "reinforcement_messages": [..], "game_configurations": [..]
        # user_profiles and game_configurations are one-to-one relations, reinforcement_messages is one-to-many
        
        resp = supabase_admin.table("users") \
                .select("""
                        id, 
                        photo_url, 
                        group_id,
                        user_profiles!user_id(
                            id,
                        ),
                        reinforcement_messages!user_id(
                            id,
                        ),
                        game_configurations!user_id(
                            id,
                        )
                        """) \
                .eq("id", student_id) \
                .execute()
                
        if not resp.data or len(resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Get the auth user data (using admin client to bypass RLS)
        auth_resp = supabase_admin.auth.api.get_user_by_id(student_id)
        
        if auth_resp != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student auth data not found"
            )
        
        student = {
                "id": resp.data[0].get("id"),
                "username": auth_resp.user.email.split("@")[0],
                "photo_url": supabase_admin.storage.from_("user_photo")
                                .get_public_url(resp.data[0].get("photo_url")) or DEFAULT_AVATAR,
                "group_id": resp.data[0].get("group_id"),
                "role": "student",
                "user_profile": resp.data[0].get("user_profiles")[0] ,
                "game_configuration": resp.data[0].get("game_configurations")[0] ,
                "reinforcement_messages": resp.data[0].get("reinforcement_messages")
        }
        
        
        return student
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting the student"
        )

@router.get("/{student_alias}/messages", summary="Gets all messages for a student using student alias")
async def get_student_messages(student_alias: str):
    """
    Retrieve all personalized messages for a student identified by alias.

    This endpoint resolves the provided student alias (the portion before the
    '@' in the student's email) into the internal Supabase user ID, then
    queries the `reinforcement_messages` -> `messages` relation to build a
    personalization-aware list of messages. Each returned message will have
    the student's alias interpolated into its `text_message` for friendly
    presentation.

    Args:
        student_alias (str): The student's alias (email prefix) used to resolve
            the Supabase user record.

    Raises:
        HTTPException: 404 NOT FOUND if the alias cannot be resolved to a
            student ID.
        HTTPException: 500 INTERNAL SERVER ERROR on unexpected failures when
            listing auth users or fetching messages from Supabase.

    Returns:
        list[dict]: A list of message objects. Each object contains:
            - id: message identifier (str or int)
            - type: message type (e.g. 'positive', 'reinforcement')
            - text_message: localized text with alias interpolated
            - icon_url: optional icon URL
            - sound_url: optional sound URL

    Notes:
        - Uses the Supabase admin client to bypass row-level security (RLS).
        - The implementation first attempts a nested select which requires
          the foreign key relations to be configured in Supabase.
        - If nested select fails, the function will try alternative queries
          (handled further down in the implementation).
    """
    try:
        # --- 1) Resolve student_alias -> student_id using admin list_users ---
        try:
            all_auth_users = supabase_admin.auth.admin.list_users(page=1, per_page=1000)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Error fetching auth users: {str(e)}")

        student_id = None
        if all_auth_users:
            for u in all_auth_users:
                # extract email safely
                try:
                    user_email = getattr(u, "email", None)
                except Exception:
                    user_email = None

                if not user_email and isinstance(u, dict):
                    user_email = u.get("email")

                if not user_email:
                    continue

                try:
                    uname = user_email.split("@")[0]
                except Exception:
                    continue

                if uname and uname.lower() == student_alias.lower():
                    # get id
                    try:
                        student_id = getattr(u, "id", None) or (u.get("id") if isinstance(u, dict) else None)
                    except Exception:
                        student_id = None
                    break

        if not student_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Student with alias '{student_alias}' not found")

        # Try nested select first (requires FK relationship configured in supabase)
        try:
            resp = supabase_admin.table("reinforcement_messages") \
                        .select("id, user_id, message_id, messages(id, type, text_message, icon_url, sound_url)") \
                        .eq("user_id", student_id) \
                        .execute()

            if resp.data:
                out = []
                for row in resp.data:
                    msg = row.get("messages")
                    if not msg:
                        continue

                    # Concatenate alias into the message text
                    out.append({
                        "id": msg.get("id"),
                        "type": msg.get("type"),
                        "text_message": "¡" + msg.get("text_message", "") + ", " + student_alias + "!",
                        "icon_url": msg.get("icon_url"),
                        "sound_url": msg.get("sound_url"),
                    })

                return out
        except Exception as nested_exc:
            # log and continue to next table name
            print(f"Nested select on {join_table} failed:", str(nested_exc))


    except HTTPException:
        raise
    except Exception as e:
        print("Error in get_student_messages_by_type:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting messages for the student: {str(e)[:300]}"
        )




