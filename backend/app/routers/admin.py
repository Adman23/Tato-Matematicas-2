from fastapi import APIRouter, HTTPException, status
from fastapi import APIRouter, HTTPException, status, Depends
from ..services.supabase import supabase_admin
from ..dependencies import is_admin_current_user
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from ..schemas.admin import AssignStudentsPayload, AssignTeachersPayload, \
                            UnassignStudentsPayload, UnassignTeachersPayload, \
                            User
router = APIRouter()

DEFAULT_AVATAR = "https://ionicframework.com/docs/img/demos/avatar.svg"



@router.get("/all_users", summary="Retrieve all the users except admins")
async def get_all_users(data: tuple=Depends(is_admin_current_user)):
    """
    !! NEW
        -> its way faster than other endpoints
        
    Retrieves from the db all the users, with all the basic info (schema admin)
    
    Args:
        None -> Uses the logged in admin
    
    Raises:
        Nothing
        
    Returns:
        list of all the users
    
    """
    
    try:
        # Retrieve all the users that doesnt have role="admin" and are 
        # To get that, we have to get all the users from auth that exist in public with that role
        
        resp = supabase_admin.table("user_accounts") \
                            .select("id, username, role, photo_url, group_id, role") \
                            .in_("role", ["teacher", "student"]) \
                            .execute()
        
        if not resp.data:
            return []
        
        users = [
            {
                **user, # Copy all the data
                
                # Get the url for the photo 
                "photo_url": supabase_admin.storage
                    .from_("user_photo")
                    .get_public_url(user["photo_url"]) 
                    if user["photo_url"] else DEFAULT_AVATAR 
            }
            for user in resp.data]
        
        return users
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting the users: {str(e)}"
        )

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
                    "photo_url": supabase_admin.storage.from_("user_photo")
                        .get_public_url(user.get("photo_url")) or DEFAULT_AVATAR
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
                    "photo_url": supabase_admin.storage.from_("user_photo")
                        .get_public_url(user.get("photo_url")) or DEFAULT_AVATAR
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


@router.post("/students/assign", summary="Asignar alumnos a un grupo")
async def assign_students_to_group(payload: AssignStudentsPayload, admin=Depends(is_admin_current_user)):
    """
    Assign students to a group.
    Assign a list of students to a group by setting their `group_id` in the `users` table.

    Args:
        - group_id (int): id from the group to assign students to
        - student_ids (list[str]): list of user ids (UUID)

    Raises:
        - HTTPException: 400 if parameters are missing, 500 if there is an error assigning

    Returns:
        - dict: {"updated": [...] } with the list of updated users

    Requires admin authentication.
    """
    try:
        # Validate payload
        if not payload.group_id or not payload.student_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="group_id and student_ids required")

        # Update group_id for users in student_ids
        resp = supabase_admin.table("users") \
            .update({"group_id": payload.group_id}) \
            .in_("id", payload.student_ids) \
            .execute()

        return {"updated": resp.data or []}

    except HTTPException:
        raise
    except Exception as e:
        print("Assign students error:", repr(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error assigning students: {str(e)}")        


@router.post("/teachers/assign", summary="Asignar profesores a un grupo")
async def assign_teachers_to_group(payload: AssignTeachersPayload, admin=Depends(is_admin_current_user)):
    """
    Assign teachers to a group.

    Assign a list of teachers to a group by creating entries in the
    `teacher_group_relations` table with (teacher_id, group_id).

    Args:
        - group_id (int): id from the group to assign
        - teacher_ids (list[str]): list of user ids (UUID)

    Raises:
        - HTTPException: 400 if parameters are missing, 500 if there is an error assigning

    Returns:
        - dict: {"inserted": [...], "skipped_existing": [...] } with the list of inserted relations and the existing ones

    Requires admin authentication.
    """
    try:
        if not payload.group_id or not payload.teacher_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="group_id and teacher_ids required")

        # Get existing relations to avoid duplicates
        existing_resp = supabase_admin.table("teacher_group_relations") \
            .select("teacher_id") \
            .eq("group_id", payload.group_id) \
            .in_("teacher_id", payload.teacher_ids) \
            .execute()

        # Get existing teacher IDs
        existing_teacher_ids = set()

        # If there are existing relations, add their teacher_ids to the set
        if existing_resp.data:
            for row in existing_resp.data:
                tid = row.get("teacher_id")
                if tid:
                    existing_teacher_ids.add(tid)

        # Prepare list of new relations to insert
        to_insert = [
            {"teacher_id": tid, "group_id": payload.group_id}
            for tid in payload.teacher_ids
            if tid not in existing_teacher_ids
        ]

        # Insert new relations
        inserted = []
        if to_insert:
            insert_resp = supabase_admin.table("teacher_group_relations").insert(to_insert).execute()
            inserted = insert_resp.data or []

        return {
            "inserted": inserted,
            "skipped_existing": list(existing_teacher_ids)
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Assign teachers error:", repr(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error assigning teachers: {str(e)}")


@router.post("/students/unassign", summary="Desmatricular alumnos de un grupo")
async def unassign_students_from_group(payload: UnassignStudentsPayload, admin=Depends(is_admin_current_user)):
    """
    Unassign students from their groups.

    Unassign a list of students from their corresponding groups by setting
    `group_id` to NULL in the `users` table for those users.

    Args:
        - student_ids (list[str]): list of user ids (UUID)

    Raises:
        - HTTPException: 400 if parameters are missing, 500 if there is an error unassigning

    Returns:
        - dict: {"updated": [...] } with the list of updated users

    Requires admin authentication.
    """
    try:
        # Validate payload
        if not payload.student_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="student_ids required")

        # Update group_id for users in student_ids
        resp = supabase_admin.table("users") \
            .update({"group_id": None}) \
            .in_("id", payload.student_ids) \
            .execute()

        return {"updated": resp.data or []}

    except HTTPException:
        raise
    except Exception as e:
        print("Unassign students error:", repr(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error unassigning students: {str(e)}")


@router.post("/teachers/unassign", summary="Desasignar profesores de un grupo")
async def unassign_teachers_from_group(payload: UnassignTeachersPayload, admin=Depends(is_admin_current_user)):
    """
    Unassign teachers from a group.

    Removes the relations (teacher_id, group_id) from the `teacher_group_relations` table.

    Args:
        - group_id (int): id from the group to unassign
        - teacher_ids (list[str]): list of user ids (UUID)

    Raises:
        - HTTPException: 400 if parameters are missing, 500 if there is an error unassigning

    Returns:
        - dict: {"deleted": [...] } with the list of deleted relations

    Requires admin authentication.
    """
    try:
        # Validate payload
        if not payload.group_id or not payload.teacher_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="group_id and teacher_ids required")

        # Delete the relations matching the given group_id and teacher_ids
        resp = supabase_admin.table("teacher_group_relations") \
            .delete() \
            .eq("group_id", payload.group_id) \
            .in_("teacher_id", payload.teacher_ids) \
            .execute()

        return {"deleted": resp.data or []}

    except HTTPException:
        raise
    except Exception as e:
        print("Unassign teachers error:", repr(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error unassigning teachers: {str(e)}")

@router.post("/upload_image", summary="Upload any image to supabase "+
                                    "storage, to use for avatars or other things")
async def upload_image(file: UploadFile = File(...), filename: str = Form(...)):
    
    """_summary_
    Args:
        file: The route to the file
        filename (str): the name of the file, its needed to fetch the url later
    
    Raises:
        HTTPException: 500 internal server error if the upload fails

    Returns:
        string: the public url of the uploaded image, you can use it directly
                to show the image (for example in the register page you have the list
                of avatars to choose from, and you can upload a new one, it will have
                the image from local and the url its what will be stored in the user
                tuple)
    """
    try:
        # "user_photo" is the storage bucket, its already created in supabase
        
        file_content = await file.read()
        response = supabase_admin.storage.from_("user_photo").upload(filename, file_content)
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error uploading image"
            )
            
        url_response = supabase_admin.storage.from_("user_photo").get_public_url(filename)
        return {"name": filename,"url": url_response}
    
    except Exception as e:
        print("Upload exception:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading image"
        )
    
@router.get("/get_images", summary="Get all the images (url) from the storage bucket")
async def get_images():
    """
    Fetches all image files stored in the "user_photo" bucket in Supabase Storage.
    Only includes common image extensions: .png, .jpg, .jpeg, .gif.
    
    Returns:
        dict: { "filename.png": "https://public-url.com/..." }
    """
    try:
        # Obtener la lista de archivos del bucket
        files = supabase_admin.storage.from_("user_photo").list()

        # Filtrar solo archivos de imagen
        image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
        image_files = [
            f for f in files
            if isinstance(f, dict) and 'name' in f and
            any(f['name'].lower().endswith(ext) for ext in image_extensions)
        ]

        images = {}
        for file in image_files:
            filename = file['name']
            public_url = supabase_admin.storage.from_("user_photo").get_public_url(filename)
            images[filename] = public_url

        return images

    except Exception as e:
        print("Error fetching images:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching images from storage"
        )


@router.get("/groups", summary="Obtener todos los grupos")
async def list_groups():
    """
    List all groups.

    Get all groups with their id and name.

    Args:
        None

    Raises:
        - HTTPException: 500 if there is an error fetching the groups

    Returns:
        - list[dict]: List of groups with fields 'id' and 'name'

    Requires admin authentication.
    """
    try:
        # Obtener todos los grupos

        resp = supabase_admin.table("groups") \
                             .select("id, alias") \
                             .execute()

        if not resp.data:
            return []

        groups = []

        for group in resp.data:
            groups.append({
                "id": group["id"],
                "name": group["alias"]
            })
        return groups
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener los grupos: {str(e)}"
        )


@router.delete("/groups/{group_id}", summary="Eliminar un grupo")
async def delete_group(group_id: int, admin=Depends(is_admin_current_user)):
    """
    Delete a group.

    Deletes a group by id.
    Steps:
    1. Unassign `group_id` from users (set group_id = NULL) to avoid references.
    2. Remove the relations in `teacher_group_relations` for that group_id.
    3. Delete the row in `groups`.

    Args:
        - group_id (int): id of the group to delete

    Raises:
        - HTTPException: 404 if the group does not exist, 500 if there is an error deleting

    Returns:
        - dict: {"deleted": [...] } with the list of deleted groups

    Requires admin authentication.
    """
    try:
        # 1) Unassign group_id from users
        supabase_admin.table("users") \
            .update({"group_id": None}) \
            .eq("group_id", group_id) \
            .execute()

        # 2) Delete teacher-group relations
        supabase_admin.table("teacher_group_relations") \
            .delete() \
            .eq("group_id", group_id) \
            .execute()

        # 3) Delete the group
        resp = supabase_admin.table("groups") \
            .delete() \
            .eq("id", group_id) \
            .execute()

        if resp and getattr(resp, 'data', None):
            return {"deleted": resp.data}
        else:
            # If no data returned, group was not found
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grupo no encontrado")

    except HTTPException:
        raise
    except Exception as e:
        print("Delete group error:", repr(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error eliminando grupo: {str(e)}")