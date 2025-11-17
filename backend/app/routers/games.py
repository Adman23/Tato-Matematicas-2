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
    Get the configuration for a specific student's game.

    Searches for a custom configuration in the `game_configurations` table.
    If none exists, returns the default configuration for the specified game.

    Args:
        student_id (str): ID of the student.
        game_key (str): Unique key of the game (e.g., "game2").
    Raises:
        HTTPException:
            - 404 NOT FOUND: If the game does not exist.
            - 500 INTERNAL SERVER ERROR: If an error occurs while fetching the configuration.
    Returns:
        GameConfigResponse: Object with the game configuration, including:
            - game_id (int)
            - game_key (str)
            - user_id (str)
            - number_range (str)
            - settings (dict)
    """
    try:
        # 1. Get the game_id from the games table
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

        # 2. Search for a custom configuration for the student
        config_resp = supabase_admin.table("game_configurations") \
            .select("*") \
            .eq("user_id", student_id) \
            .eq("game_id", game_id) \
            .execute()

        # 3. If it exists, return it
        if config_resp.data and len(config_resp.data) > 0:
            config = config_resp.data[0]
            return GameConfigResponse(
                game_id=game_id,
                game_key=game_key,
                user_id=student_id,
                number_range=config.get("number_range", "0-10"),
                settings=config.get("settings", {})
            )

        # 4. If it does not exist, return the default configuration
        if game_key == "touch_number":
            default_settings = {
                "options_count": 5,  # 5 options to touch
                "voice": "woman"  # Default female voice
            }
        if game_key == "order_sequence":
            default_settings = {
                "quantity": 5,  # 5 numbers to order
                "order": "ascending"  # ascending order
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
    Creates a new game session for a student.

    The session is saved in the `game_sessions` table with counters initialized
    and an empty `results` field to store attempts.

    Args:
        request (CreateSessionRequest): Data with `student_id` and `game_key`.

    Raises:
        HTTPException:
            - 404 NOT FOUND: If the game does not exist.
            - 500 INTERNAL SERVER ERROR: If an error occurs while creating the session.

    Returns:
        dict: Contains:
            - session_id (str): ID of the created session.
            - message (str): Confirmation message.
    """
    try:
        # 1. Get the game_id from the games table
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

        # 2. Create the session in game_sessions
        session_data = {
            "student_id": request.student_id,
            "game_id": game_id,
            "results": {"attempts": []},  # Empty array to store rounds
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
    Saves the result of a round within an active session.

    The result is added to the attempts array in the `results.attempts` field,
    and the counters for correct and incorrect answers are updated.

    Args:
        session_id (str): ID of the game session.
        request (SaveRoundRequest): Data with the round result.
    Raises:
        HTTPException:
            - 404 NOT FOUND: If the session does not exist.
            - 500 INTERNAL SERVER ERROR: If an error occurs while saving the round.
    Returns:
        dict: Contains:
            - message (str): Confirmation.
            - total_correct (int): Total correct answers.
            - total_incorrect (int): Total incorrect answers.
    """
    try:
        # 1. Get the current session
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

        # 2. Add the new round to the attempts array
        # Differentiate by game type
        if session.get("game_id") == 1:
            # Game 1: Touch number
            round_data = {
                "round": request.round_result.round,
                "numbers": request.round_result.numbers,
                "selected_number": request.round_result.selected_number,
                "correct_number": request.round_result.correct_number,
                "is_correct": request.round_result.is_correct,
                "time": request.round_result.time_seconds
            }
        elif session.get("game_id") == 2:
            # Game 2: Order sequence
            round_data = {
                "round": request.round_result.round,
                "numbers": request.round_result.numbers,
                "user_order": request.round_result.user_order,
                "correct_order": request.round_result.correct_order,
                "is_correct": request.round_result.is_correct,
                "time": request.round_result.time_seconds,
                "attempts": request.round_result.attempts or 0,
                "hints": request.round_result.hints or 0
            }
        else:
            # Unknown game, use generic fields
            round_data = {
                "round": request.round_result.round,
                "numbers": request.round_result.numbers,
                "is_correct": request.round_result.is_correct,
                "time": request.round_result.time_seconds
            }

        if "attempts" not in results:
            results["attempts"] = []

        results["attempts"].append(round_data)

        # 3. Update totals only if it is the final attempt of the round
        total_correct = session.get("total_correct", 0)
        total_incorrect = session.get("total_incorrect", 0)
        total_omissions = session.get("total_omissions", 0)

        if request.round_result.is_final_attempt:
            # Count how many numbers were placed correctly/incorrectly
            # user_order and correct_order have the same length (fixed positions)
            # -1 in user_order means empty position (omission)
            correct_count = 0
            incorrect_count = 0

            for i, (user_num, correct_num) in enumerate(zip(request.round_result.user_order, request.round_result.correct_order)):
                if user_num == -1:
                    # Empty position, already counted in omissions
                    continue
                elif user_num == correct_num:
                    correct_count += 1
                else:
                    incorrect_count += 1

            omissions_count = request.round_result.omissions

            total_correct += correct_count
            total_incorrect += incorrect_count
            total_omissions += omissions_count

        # 4. Update the session in the database
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
    Finish a game session and save the total time.

    Updates the `finished_at` field and adds `total_time` inside the `results` field.

    Args:
        session_id (str): ID of the game session.
        request (FinishSessionRequest): Total time of the session.

    Raises:
        HTTPException:
            - 404 NOT FOUND: If the session does not exist.
            - 500 INTERNAL SERVER ERROR: If an error occurs while finishing the session.

    Returns:
        dict: Contains:
            - message (str): Confirmation.
            - session_id (str): ID of the finished session.
    """
    try:
        # 1. Verify that the session exists
        session_resp = supabase_admin.table("game_sessions") \
            .select("*") \
            .eq("id", session_id) \
            .execute()

        if not session_resp.data or len(session_resp.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game session not found"
            )

        # 2. Update the session with the finish time
        update_data = {
            "finished_at": datetime.utcnow().isoformat()
        }

        # Optionally save the total time in results
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
    Gets all game sessions of a student.

    Allows optional filtering by a game key (`game_key`).

    Args:
        student_id (str): ID of the student.
        game_key (Optional[str]): Game key to filter by (optional).

    Raises:
        HTTPException:
            - 500 INTERNAL SERVER ERROR: If an error occurs while getting the sessions.

    Returns:
        dict: Contains:
            - sessions (list): List of the student's sessions, ordered by start date descending.
    """
    try:
        query = supabase_admin.table("game_sessions") \
            .select("*, games(key, name)") \
            .eq("student_id", student_id) \
            .order("started_at", desc=True)

        # If a game is specified, filter by it
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
