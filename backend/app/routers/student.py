"""
Router de Estudiantes
Endpoints: /student/all
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import Optional
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
            photo =  supabase_admin.storage.from_("user_photo").get_public_url(s.get("photo_url"))  or DEFAULT_AVATAR

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
    basic info (id, username, photo, group, password type and password length) and related data from other
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
            - password_type (str): Type of password for the student.
            - password_length (int): Length of the password.
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
                        password_type,
                        password_length,
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
                "password_type": resp.data[0].get("password_type"),
                "password_length": resp.data[0].get("password_length"),
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


class AddMessageRequest(BaseModel):
    """
    Schema for adding a message to a student.
    """
    text_message: str
    type: str  # 'positive' or 'reinforcement'
    icon_url: Optional[str] = None
    sound_url: Optional[str] = None


@router.post("/{student_id}/message", summary="Adds a message to a student")
async def add_message_to_student(student_id: str, message_data: AddMessageRequest):
    """
    Add a message to a specific student.

    This endpoint performs the following steps:
    1. Checks if the message already exists in the `messages` table (by text_message and type).
    2. If it doesn't exist, creates the message in the `messages` table.
    3. Assigns the message to the student in the `reinforcement_messages` table.

    Args:
        student_id (str): The unique identifier (UUID) of the student.
        message_data (AddMessageRequest): The message data containing:
            - text_message (str): The text content of the message.
            - type (str): The type of message ('positive' or 'reinforcement').
            - icon_url (str, optional): URL of the icon associated with the message.
            - sound_url (str, optional): URL of the sound associated with the message.

    Raises:
        HTTPException:
            - 400 BAD REQUEST: If the message type is invalid.
            - 404 NOT FOUND: If the student does not exist.
            - 409 CONFLICT: If the message is already assigned to this student.
            - 500 INTERNAL SERVER ERROR: If an unexpected error occurs.

    Returns:
        dict: A dictionary containing:
            - message (str): Success message.
            - message_id (str): The ID of the message (new or existing).
            - reinforcement_message_id (str): The ID of the assignment in `reinforcement_messages`.
    """
    try:
        # Validate that message is not empty
        if not message_data.text_message or not message_data.text_message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message text cannot be empty"
            )

        # Validate message type
        valid_types = ['positive', 'reinforcement']
        if message_data.type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid message type. Must be one of: {valid_types}"
            )

        # Check if student exists
        student_resp = supabase_admin.table("users") \
            .select("id") \
            .eq("id", student_id) \
            .eq("role", "student") \
            .execute()

        if not student_resp.data or len(student_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        # Step 1: Check if the message already exists in the messages table
        existing_message_resp = supabase_admin.table("messages") \
            .select("id") \
            .eq("text_message", message_data.text_message) \
            .eq("type", message_data.type) \
            .execute()

        message_id = None

        if existing_message_resp.data and len(existing_message_resp.data) > 0:
            # Message already exists, use existing ID
            message_id = existing_message_resp.data[0].get("id")
        else:
            # Step 2: Create the message in the messages table
            new_message = {
                "text_message": message_data.text_message,
                "type": message_data.type,
                "icon_url": message_data.icon_url,
                "sound_url": message_data.sound_url
            }

            create_message_resp = supabase_admin.table("messages") \
                .insert(new_message) \
                .execute()

            if not create_message_resp.data or len(create_message_resp.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error creating the message"
                )

            message_id = create_message_resp.data[0].get("id")

        # Step 3: Check if the message is already assigned to this student
        existing_assignment_resp = supabase_admin.table("reinforcement_messages") \
            .select("id") \
            .eq("user_id", student_id) \
            .eq("message_id", message_id) \
            .execute()

        if existing_assignment_resp.data and len(existing_assignment_resp.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This message is already assigned to this student"
            )

        # Step 4: Assign the message to the student in reinforcement_messages
        assignment_data = {
            "user_id": student_id,
            "message_id": message_id
        }

        assignment_resp = supabase_admin.table("reinforcement_messages") \
            .insert(assignment_data) \
            .execute()

        if not assignment_resp.data or len(assignment_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error assigning the message to the student"
            )

        return {
            "message": "Message added successfully to the student",
            "message_id": message_id,
            "reinforcement_message_id": assignment_resp.data[0].get("id")
        }

    except HTTPException:
        raise
    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding message to student"
        )
