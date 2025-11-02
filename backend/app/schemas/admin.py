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
