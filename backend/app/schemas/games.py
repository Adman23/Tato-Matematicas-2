from pydantic import BaseModel

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
    """Resultado de una ronda.

    Los distintos juegos envían campos diferentes. Hacemos opcionales
    los campos que no aplican a todos los juegos (por ejemplo
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


class SaveRoundRequest(BaseModel):
    """Guardar resultado de ronda"""
    round_result: RoundResult


class FinishSessionRequest(BaseModel):
    """Finalizar sesión de juego"""
    total_time_seconds: float

