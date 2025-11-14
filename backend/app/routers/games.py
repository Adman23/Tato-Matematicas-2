"""
Router de Juegos
Endpoints para gestionar configuraciones, sesiones y resultados de los juegos
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..services.supabase import supabase_admin
from ..dependencies import get_current_user

from ..schemas.games import (
    GameConfigResponse,
    CreateSessionRequest,
    SaveRoundRequest,
    FinishSessionRequest,
)

router = APIRouter()

# ===== ENDPOINTS =====

@router.get("/config/{student_id}/{game_key}", response_model=GameConfigResponse)
async def get_game_config(student_id: str, game_key: str):
    """
    Obtiene la configuración del juego para un estudiante específico.

    Busca una configuración personalizada del estudiante para el juego dado.
    Si no existe, devuelve una configuración por defecto.

    Args:
        student_id (str): ID del estudiante.
        game_key (str): Clave única del juego (por ejemplo, "game2").

    Raises:
        HTTPException:
            - 404 NOT FOUND: Si el juego no existe.
            - 500 INTERNAL SERVER ERROR: Si ocurre un error al obtener la configuración.

    Returns:
        GameConfigResponse: Objeto con la configuración del juego, incluyendo:
            - game_id (int)
            - game_key (str)
            - user_id (str)
            - number_range (str)
            - settings (dict)
    """
    try:
        # 1. Obtener el game_id desde la tabla games
        game_resp = supabase_admin.table("games") \
            .select("id, key, name") \
            .eq("key", game_key) \
            .execute()

        if not game_resp.data or len(game_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Game with key '{game_key}' not found"
            )

        game = game_resp.data[0]
        game_id = game["id"]

        # 2. Buscar configuración personalizada del estudiante
        config_resp = supabase_admin.table("game_configurations") \
            .select("*") \
            .eq("user_id", student_id) \
            .eq("game_id", game_id) \
            .execute()

        # 3. Si existe, devolverla
        if config_resp.data and len(config_resp.data) > 0:
            config = config_resp.data[0]
            return GameConfigResponse(
                game_id=game_id,
                game_key=game_key,
                user_id=student_id,
                number_range=config.get("number_range", "0-10"),
                settings=config.get("settings", {})
            )

        # 4. Si no existe, devolver configuración por defecto 
        if game_key == "touch_number":
            default_settings = {
                "options_count": 5  # 5 opciones para tocar
            }
        if game_key == "order_sequence":
            default_settings = {
                "quantity": 5,  # 5 números a ordenar
                "order": "ascending"  # orden ascendente
            }

        return GameConfigResponse(
            game_id=game_id,
            game_key=game_key,
            user_id=student_id,
            number_range="0-10",
            settings=default_settings
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting game config: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting game configuration: {str(e)}"
        )


@router.post("/sessions")
async def create_game_session(request: CreateSessionRequest):
    """
    Crea una nueva sesión de juego para un estudiante.

    La sesión se guarda en la tabla `game_sessions` con los contadores inicializados
    y un campo `results` vacío para almacenar los intentos.

    Args:
        request (CreateSessionRequest): Datos con `student_id` y `game_key`.

    Raises:
        HTTPException:
            - 404 NOT FOUND: Si el juego no existe.
            - 500 INTERNAL SERVER ERROR: Si ocurre un error al crear la sesión.

    Returns:
        dict: Contiene:
            - session_id (str): ID de la sesión creada.
            - message (str): Mensaje de confirmación.
    """
    try:
        # 1. Obtener el game_id desde la tabla games
        game_resp = supabase_admin.table("games") \
            .select("id") \
            .eq("key", request.game_key) \
            .execute()

        if not game_resp.data or len(game_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Game with key '{request.game_key}' not found"
            )

        game_id = game_resp.data[0]["id"]

        # 2. Crear la sesión en game_sessions
        session_data = {
            "student_id": request.student_id,
            "game_id": game_id,
            "results": {"attempts": []},  # Array vacío para ir guardando rondas
            "total_correct": 0,
            "total_incorrect": 0,
            "total_omissions": 0,
            "started_at": datetime.utcnow().isoformat()
        }

        session_resp = supabase_admin.table("game_sessions") \
            .insert(session_data) \
            .execute()

        if not session_resp.data or len(session_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error creating game session"
            )

        return {
            "session_id": session_resp.data[0]["id"],
            "message": "Game session created successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating game session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating game session: {str(e)}"
        )


@router.post("/sessions/{session_id}/round")
async def save_round_result(session_id: str, request: SaveRoundRequest):
    """
    Guarda el resultado de una ronda dentro de una sesión activa.

    El resultado se añade al array de intentos en el campo `results.attempts`,
    y se actualizan los contadores de aciertos y errores.

    Args:
        session_id (str): ID de la sesión de juego.
        request (SaveRoundRequest): Datos con el resultado de la ronda.

    Raises:
        HTTPException:
            - 404 NOT FOUND: Si la sesión no existe.
            - 500 INTERNAL SERVER ERROR: Si ocurre un error al guardar la ronda.

    Returns:
        dict: Contiene:
            - message (str): Confirmación.
            - total_correct (int): Total de respuestas correctas.
            - total_incorrect (int): Total de respuestas incorrectas.
    """
    try:
        # 1. Obtener la sesión actual
        session_resp = supabase_admin.table("game_sessions") \
            .select("*") \
            .eq("id", session_id) \
            .execute()

        if not session_resp.data or len(session_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game session not found"
            )

        session = session_resp.data[0]
        results = session.get("results", {"attempts": []})

        # 2. Añadir la nueva ronda al array de attempts
        if session.get("game_id") == 1:
            round_data = {
                "round": request.round_result.round,
                "numbers": request.round_result.numbers,
                "selected_number": request.round_result.selected_number,
                "correct_number": request.round_result.correct_number,
                "is_correct": request.round_result.is_correct,
                "time": request.round_result.time_seconds
            }

        if session.get("game_id") == 2:
            round_data = {
                "round": request.round_result.round,
                "numbers": request.round_result.numbers,
                "user_order": request.round_result.user_order,
                "correct_order": request.round_result.correct_order,
                "is_correct": request.round_result.is_correct,
                "time": request.round_result.time_seconds
            }

        

        if "attempts" not in results:
            results["attempts"] = []

        results["attempts"].append(round_data)

        # 3. Actualizar totales solo si es el intento final de la ronda
        total_correct = session.get("total_correct", 0)
        total_incorrect = session.get("total_incorrect", 0)
        total_omissions = session.get("total_omissions", 0)

        if request.round_result.is_final_attempt:
            # Contar cuántos números colocó correctamente/incorrectamente
            # user_order y correct_order tienen la misma longitud (posiciones fijas)
            # -1 en user_order significa posición vacía (omisión)
            correct_count = 0
            incorrect_count = 0

            for i, (user_num, correct_num) in enumerate(zip(request.round_result.user_order, request.round_result.correct_order)):
                if user_num == -1:
                    # Posición vacía, ya contada en omissions
                    continue
                elif user_num == correct_num:
                    correct_count += 1
                else:
                    incorrect_count += 1

            omissions_count = request.round_result.omissions

            total_correct += correct_count
            total_incorrect += incorrect_count
            total_omissions += omissions_count

        # 4. Actualizar la sesión en la base de datos
        update_data = {
            "results": results,
            "total_correct": total_correct,
            "total_incorrect": total_incorrect,
            "total_omissions": total_omissions
        }

        supabase_admin.table("game_sessions") \
            .update(update_data) \
            .eq("id", session_id) \
            .execute()

        return {
            "message": "Round result saved successfully",
            "total_correct": total_correct,
            "total_incorrect": total_incorrect
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving round result: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving round result: {str(e)}"
        )


@router.post("/sessions/{session_id}/finish")
async def finish_game_session(session_id: str, request: FinishSessionRequest):
    """
    Finaliza una sesión de juego y guarda el tiempo total.

    Actualiza el campo `finished_at` y añade `total_time` dentro del campo `results`.

    Args:
        session_id (str): ID de la sesión de juego.
        request (FinishSessionRequest): Tiempo total de la sesión.

    Raises:
        HTTPException:
            - 404 NOT FOUND: Si la sesión no existe.
            - 500 INTERNAL SERVER ERROR: Si ocurre un error al finalizar la sesión.

    Returns:
        dict: Contiene:
            - message (str): Confirmación.
            - session_id (str): ID de la sesión finalizada.
    """
    try:
        # 1. Verificar que la sesión existe
        session_resp = supabase_admin.table("game_sessions") \
            .select("*") \
            .eq("id", session_id) \
            .execute()

        if not session_resp.data or len(session_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game session not found"
            )

        # 2. Actualizar la sesión con el tiempo de finalización
        update_data = {
            "finished_at": datetime.utcnow().isoformat()
        }

        # Opcionalmente guardar el tiempo total en results
        session = session_resp.data[0]
        results = session.get("results", {})
        results["total_time"] = request.total_time_seconds
        update_data["results"] = results

        supabase_admin.table("game_sessions") \
            .update(update_data) \
            .eq("id", session_id) \
            .execute()

        return {
            "message": "Game session finished successfully",
            "session_id": session_id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finishing game session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error finishing game session: {str(e)}"
        )


@router.get("/sessions/student/{student_id}")
async def get_student_sessions(student_id: str, game_key: Optional[str] = None):
    """
    Obtiene todas las sesiones de juego de un estudiante.

    Permite filtrar opcionalmente por una clave de juego (`game_key`).

    Args:
        student_id (str): ID del estudiante.
        game_key (Optional[str]): Clave del juego para filtrar (opcional).

    Raises:
        HTTPException:
            - 500 INTERNAL SERVER ERROR: Si ocurre un error al obtener las sesiones.

    Returns:
        dict: Contiene:
            - sessions (list): Lista de sesiones del estudiante, ordenadas por fecha de inicio descendente.
    """
    try:
        query = supabase_admin.table("game_sessions") \
            .select("*, games(key, name)") \
            .eq("student_id", student_id) \
            .order("started_at", desc=True)

        # Si se especifica un juego, filtrar por él
        if game_key:
            game_resp = supabase_admin.table("games") \
                .select("id") \
                .eq("key", game_key) \
                .execute()

            if game_resp.data and len(game_resp.data) > 0:
                game_id = game_resp.data[0]["id"]
                query = query.eq("game_id", game_id)

        sessions_resp = query.execute()

        return {
            "sessions": sessions_resp.data or []
        }

    except Exception as e:
        print(f"Error getting student sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting student sessions: {str(e)}"
        )
