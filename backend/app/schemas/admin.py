from pydantic import BaseModel

class Teacher(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "teacher"

    class Config:
        orm_mode = True


class Student(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "student"

    class Config:
        orm_mode = True


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

