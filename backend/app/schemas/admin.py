from pydantic import BaseModel

class Teacher(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "teacher"

    model_config = {"from_attributes": True}



class Student(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "student"

    model_config = {"from_attributes": True}



class AssignStudentsPayload(BaseModel):
    group_id: int
    student_ids: list[str]


class AssignTeachersPayload(BaseModel):
    group_id: int
    teacher_ids: list[str]


class UnassignStudentsPayload(BaseModel):
    student_ids: list[str]


class UnassignTeachersPayload(BaseModel):
    group_id: int
    teacher_ids: list[str]

