"""
Router de Juegos
Endpoints para gestionar configuraciones, sesiones y resultados de los juegos
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..services.supabase import supabase_admin
from ..dependencies import get_current_user

router = APIRouter()


# ===== SCHEMAS =====

class GameConfigResponse(BaseModel):
    """Configuración del juego para un estudiante"""
    game_id: int
    game_key: str
    user_id: str
    number_range: str
    settings: Dict[str, Any]


class CreateSessionRequest(BaseModel):
    """Crear nueva sesión de juego"""
    student_id: str
    game_key: str  # 'game2'


class RoundResult(BaseModel):
    """Resultado de una ronda"""
    round: int
    numbers: List[int]
    user_order: List[int]
    correct_order: List[int]
    is_correct: bool
    time_seconds: float


class SaveRoundRequest(BaseModel):
    """Guardar resultado de ronda"""
    round_result: RoundResult


class FinishSessionRequest(BaseModel):
    """Finalizar sesión de juego"""
    total_time_seconds: float


# ===== ENDPOINTS =====

@router.get("/config/{student_id}/{game_key}", response_model=GameConfigResponse)
async def get_game_config(student_id: str, game_key: str):
    """
    Obtiene la configuración del juego para un estudiante específico.
    Si no existe configuración personalizada, devuelve la configuración por defecto.
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

        # 4. Si no existe, devolver configuración por defecto para Game2
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
    Crea una nueva sesión de juego.
    Retorna el ID de la sesión creada.
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
    Guarda el resultado de una ronda en la sesión de juego.
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

        # 3. Actualizar totales
        total_correct = session.get("total_correct", 0)
        total_incorrect = session.get("total_incorrect", 0)

        if request.round_result.is_correct:
            total_correct += 1
        else:
            total_incorrect += 1

        # 4. Actualizar la sesión en la base de datos
        update_data = {
            "results": results,
            "total_correct": total_correct,
            "total_incorrect": total_incorrect
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
    Finaliza una sesión de juego, guardando el tiempo total.
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
    Opcionalmente filtrar por game_key.
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
