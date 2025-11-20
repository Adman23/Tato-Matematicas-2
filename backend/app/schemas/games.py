"""
Game schemas

This module defines schemas for managing game configurations, sessions, and round results.

"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class GameConfigResponse(BaseModel):
    """
    Game configuration data model
    """
    game_id: int
    game_key: str
    user_id: str
    number_range: str
    settings: Dict[str, Any]


class CreateSessionRequest(BaseModel):
    """
    Game session creation request model
    """
    student_id: str
    game_key: str  # 'game2'


class RoundResult(BaseModel):
    """
    Round result.

    Different games send different fields. We make optional
    the fields that do not apply to all games (for example
    `user_number`/`correct_number` vs `user_order`/`correct_order`).
    """
    round: int
    numbers: List[int]
    is_correct: bool
    time_seconds: float

    # Campos para el juego 1: selección de un número
    selected_number: Optional[int] = None
    correct_number: Optional[int] = None

    # Campos para el juego 2: ordenar una secuencia
    user_order: Optional[List[int]] = None
    correct_order: Optional[List[int]] = None

    # Indicadores adicionales usados por el backend al procesar la ronda
    # is_final_attempt: marca si el intento es el definitivo de la ronda
    is_final_attempt: Optional[bool] = False
    # omissions: número de posiciones omitidas por el usuario (por ejemplo -1 en user_order)
    omissions: Optional[int] = 0
    # attempts: contador de intentos (veces que presionó "Repetir")
    attempts: Optional[int] = 0
    # hints: contador de pistas usadas
    hints: Optional[int] = 0


class SaveRoundRequest(BaseModel):
    """
    Save round result
    """
    round_result: RoundResult


class FinishSessionRequest(BaseModel):
    """
    Finish game session
    """
    total_time_seconds: float

