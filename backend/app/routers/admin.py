from fastapi import APIRouter, HTTPException, status
from fastapi import APIRouter, HTTPException, status, Depends
from ..services.supabase import supabase
from ..services.supabase import supabase_admin
from ..dependencies import get_current_admin
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from ..schemas.admin import AssignStudentsPayload, AssignTeachersPayload, UnassignStudentsPayload, UnassignTeachersPayload
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


@router.post("/students/assign", summary="Asignar alumnos a un grupo")
async def assign_students_to_group(payload: AssignStudentsPayload, admin=Depends(get_current_admin)):
    """
    Asigna una lista de estudiantes a un grupo (actualiza group_id en public.users).

    Body:
      - group_id (int): id del grupo al que asignar
      - student_ids (list[str]): lista de ids de usuario (UUID)

    Requiere autenticación de admin.
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
async def assign_teachers_to_group(payload: AssignTeachersPayload, admin=Depends(get_current_admin)):
    """
    Asigna una lista de profesores a un grupo creando entradas en la tabla
    `teacher_group_relations` con (teacher_id, group_id).

    Body:
      - group_id (int): id del grupo al que asignar
      - teacher_ids (list[str]): lista de ids de usuario (UUID)

    Requiere autenticación de admin.
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
async def unassign_students_from_group(payload: UnassignStudentsPayload, admin=Depends(get_current_admin)):
    """
    Desmatricula una lista de estudiantes  de sus correspondientes grupos estableciendo
    `group_id` a NULL en la tabla `users` para esos usuarios.

    Body:
      - student_ids (list[str]): lista de ids de usuario (UUID)

    Requiere autenticación de admin.
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
async def unassign_teachers_from_group(payload: UnassignTeachersPayload, admin=Depends(get_current_admin)):
    """
    Elimina las relaciones (teacher_id, group_id) de la tabla `teacher_group_relations`.

    Body:
      - group_id (int): id del grupo del que desasignar
      - teacher_ids (list[str]): lista de ids de usuario (UUID)

    Requiere autenticación de admin.
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
        return {"url": url_response}
    
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
