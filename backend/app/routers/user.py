"""
!! NEW FILE 1.2.0
		->  This file will scrap some code from other routers to centrilize
				all of the functionality general for all the users
		->  It has functions that any type of user could use, but the return values or implementation
				can differ based on the user "role", the role will be checked directly from the database
				to remove the posibility of a user changing its role directly in the frontend call, so
				it should only need the id of the user in case

General user management router
Endpoints: /user/*
"""
from fastapi import APIRouter, Body, HTTPException, status, Depends
from ..schemas.auth import (
	User,
	UserData,
)

from ..services.supabase import supabase
from ..services.supabase import supabase_admin
from ..dependencies import is_auth_current_user
from ..schemas.auth import UserUpdate, UserData # Asegúrate de importar UserUpdate
from fastapi import APIRouter, HTTPException, status, Depends

# Config router
router = APIRouter()

DEFAULT_AVATAR = "https://ionicframework.com/do	cs/img/demos/avatar.svg"

# !! NEW 1.2.0
#	-> Replaces "me" endpoint, uses is_auth_current_user to check for the user launching this
#
async def fetch_basic_info(user_id: str):
	"""
	Return the basic info of a user.

	Uses the id passed to return the basic info of a user, this includes:
	user:{
	id:       "string_with_the_id",         not null
	username: "email without the @",        not null
	role:     "student, admin or teacher",  not null
	photo_url:"url of the photo associated, can be null"
	}

	Args:
		user_id, email

	Returns:
		User(with the data)
	"""
	try:
		response = supabase_admin.table("user_accounts") \
						.select("username, role, photo_url")\
						.eq("id", user_id) \
						.single() \
						.execute()

		if not response.data:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=f"Error fetching the user basic_info: {response.error}"
			)

		username 	= response.data.get("username")
		role 		= response.data.get("role")
		photo_url 	= supabase_admin.storage.from_("user_photo").get_public_url(response.data.get("photo_url")) or DEFAULT_AVATAR

		return User(id=user_id, username=username, role=role, photo_url=photo_url)

	except Exception as e:
		raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Error getting the basic info of the current user: {str(e)}"
		)


@router.get("/basic_info", response_model=User)
async def get_basic_info(data: tuple = Depends(is_auth_current_user)):
	"""
	Edpoint that returns basic info of the user, uses the fetch_basic_info
	to reuse that function.
	"""
	user_id, email = data
	return await (fetch_basic_info(user_id))	

# !! NEW 1.2.0
#	-> Retrieves all the possible info of a user from the
# 	-> Should be used with care, not very time efficient
#
@router.get("/{user_id}/user_data", response_model=UserData)
async def get_user_data(user_id: str):
	"""
	Return all the info of a user

	Uses the id passed to return the basic info of a user, this includes:
	user:{
		id:       			"string_with_the_id",         								not null
		username: 			"email without the @",        								not null
		role:     			"student, admin or teacher",  								not null
		photo_url:			"url of the photo associated", 								can be null
		password_type:		"graphical, pin, or alphanumeric",							not null
		password_length:	"Number of characters (for alphanumeric/PIN passwords) 
          					or number of pictograms (for graphical passwords)",	not null
		user_profile
		game_configurations
		reinforcemente_messages
	}
	-> 	group_id could be aded, but its only for students and not really of much use
			its only used to get the students of a group, this function is to get the basic
			info of a only user.

	Returns:
		User(with the data)
	"""
	try:
		# Fetch the basic info of the user 
		user = await fetch_basic_info(user_id)

		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=f"There is no user"
			)

		# Fetch all the extra info of the user
		# Fetch user's direct relations (keep it simple to avoid complex nested selects)
		resp = supabase_admin.table("users") \
				.select("group_id, password_type, password_length,\
						user_profiles!user_id(\
							id,\
							text_preferences,\
							audio_preferences,\
							accessibility_settings,\
            				color_preferences\
						),\
						game_configurations!user_id(\
							id,\
							game_id,\
							number_range,\
							settings\
						),\
						reinforcement_messages!user_id(\
							id,\
							message_id\
						)") \
				.eq("id", user_id) \
				.single() \
				.execute()

                
		if not resp.data or len(resp.data) == 0:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="User not found"
			)

		# If we need the full message payload (with messages.*), fetch them from
		# the reinforcement_messages table joining messages separately. This
		# avoids deep nested selects that can fail parsing in PostgREST.
		reinforcement_messages_full = []
		try:
			rresp = supabase_admin.table("reinforcement_messages") \
						.select("messages(id, type, text_message, icon_url, sound_url)") \
						.eq("user_id", user_id) \
						.execute()

			if rresp.data:
				reinforcement_messages_full = rresp.data
		except Exception:
			# If this fails, fall back to the lighter payload already in `resp`
			reinforcement_messages_full = resp.data.get("reinforcement_messages")

		print("SE EJECUTA EL GET_USER_DATA")
		return UserData(id=user.id, 
						username=user.username,
						role=user.role,
						photo_url=user.photo_url or DEFAULT_AVATAR,
                  password_type = resp.data.get("password_type"),
                  password_length = resp.data.get("password_length"),
						group_id=resp.data.get("group_id") or None,
						user_profile=resp.data.get("user_profiles"),
						game_configurations=resp.data.get("game_configurations"),
						reinforcement_messages=reinforcement_messages_full,
						)
                

	except Exception as e:
		raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Error getting the complete data of the user: {str(e)}"
		)


# En backend/app/routers/users.py

@router.patch("/{target_user_id}", response_model=UserData)
async def update_user(
    target_user_id: str, 
    payload: UserUpdate, 
    current_user: tuple = Depends(is_auth_current_user)
):
    requester_id, requester_email = current_user
    
    # 1. VERIFICAR PERMISOS (MODIFICADO)
    # Si el usuario intenta editar a otro, verificamos si tiene rango superior
    if requester_id != target_user_id:
        # Consultamos el rol de quien hace la petición
        requester_data = supabase_admin.table("users")\
            .select("role")\
            .eq("id", requester_id)\
            .single()\
            .execute()
            
        requester_role = requester_data.data.get("role") if requester_data.data else "student"
        
        # Solo permitimos si es Profesor o Admin
        if requester_role not in ["admin", "teacher"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para editar a este usuario."
            )

    try:
        # 2. ACTUALIZAR AUTH (Email/Username y Password)
        auth_attributes = {}
        
        if payload.username:
            new_email = f"{payload.username}@tatomaths.local"
            # Solo actualizamos si el email cambia
            # Nota: Para editar a OTROS, no podemos comparar con requester_email.
            # Deberíamos comparar con el email del target, pero Supabase Auth maneja
            # la redundancia internamente si el email es el mismo, así que lo enviamos.
            auth_attributes["email"] = new_email

        if payload.password:
            auth_attributes["password"] = payload.password

        if auth_attributes:
            try:
                supabase_admin.auth.admin.update_user_by_id(target_user_id, auth_attributes)
            except Exception as e:
                msg = str(e).lower()
                if "duplicate" in msg or "unique" in msg:
                    raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso.")
                raise e

        # 3. ACTUALIZAR DB PÚBLICA (Solo foto y tipo y longitud de contraseña, sin group_id)
        public_updates = {}
        if payload.photo_url:
            public_updates["photo_url"] = payload.photo_url
         
        if payload.password_type:
           public_updates["password_type"] = payload.password_type
         
        if payload.password_length is not None:
           public_updates["password_length"] = payload.password_length
            
        if public_updates:
            supabase_admin.table("users")\
                .update(public_updates)\
                .eq("id", target_user_id)\
                .execute()

        # 4. CONSTRUIR RESPUESTA
        resp = supabase_admin.table("users") \
                .select("id, role, photo_url, group_id, password_type, password_length \
                        user_profiles!user_id(*), \
                        game_configurations!user_id(*)") \
                .eq("id", target_user_id) \
                .single() \
                .execute()

        if not resp.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado tras actualización")

        user_data_db = resp.data
        
        # Calculamos el username final
        final_username = payload.username if payload.username else None
        
        # Si no cambiamos el nombre, intentamos recuperarlo de Auth (o usamos un placeholder seguro)
        if not final_username:
             try:
                target_auth = supabase_admin.auth.admin.get_user_by_id(target_user_id)
                if target_auth and target_auth.user and target_auth.user.email:
                    final_username = target_auth.user.email.split("@")[0]
             except:
                final_username = "usuario" # Fallback raro

        # Manejo seguro de listas
        u_profile = user_data_db.get("user_profiles")
        if isinstance(u_profile, list) and len(u_profile) > 0:
            u_profile = u_profile[0]
        elif isinstance(u_profile, list):
             u_profile = None
             
        return UserData(
            id=user_data_db["id"],
            username=final_username,
            role=user_data_db["role"],
            photo_url=user_data_db.get("photo_url"),
            password_type = user_data_db.get("password_type"),
            password_length = user_data_db.get("password_length"),
            group_id=user_data_db.get("group_id"),
            user_profile=u_profile,
            game_configurations=user_data_db.get("game_configurations") or [],
            reinforcement_messages=[] 
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in update_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

@router.post("/{user_id}/update_color_preferences")
async def update_color_preferences(user_id: str, color_preferences: dict):
    """
    Actualiza la paleta de colores de un usuario.
    """
    try:
        update = supabase_admin.table("user_profiles")\
            .update({"color_preferences": color_preferences})\
            .eq("user_id", user_id)\
            .execute()

        print("Datos guardados:", update.data)  # debería mostrar la fila actualizada
        return {"message": "Color preferences updated", "saved": color_preferences}

    except Exception as e:
        print("Excepción capturada:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Error updating color preferences: {str(e)}"
        )
    

@router.get("/{user_id}/color_preferences")
async def get_color_preferences(user_id: str):
    """
    Obtiene la paleta de colores empleada por un usuario.
    """
    try:
        resp = supabase_admin.table("user_profiles")\
            .select("color_preferences")\
            .eq("user_id", user_id)\
            .single()\
            .execute()

        if not resp.data:
            raise HTTPException(404, "User not found")

        return resp.data["color_preferences"]

    except Exception as e:
        raise HTTPException(500, f"Error fetching color preferences: {e}")