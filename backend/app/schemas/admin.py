"""
Admin schemas

This module defines schemas for managing teachers and students in groups.

"""

from pydantic import BaseModel

class Teacher(BaseModel):
    """
    Teacher data model
    """
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "teacher"

    model_config = {"from_attributes": True}


class Student(BaseModel):
    """
    Student data model
    """
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "student"

    model_config = {"from_attributes": True}


class AssignStudentsPayload(BaseModel):
    """
    Payload model for assigning students to a group
    """
    group_id: int
    student_ids: list[str]


class AssignTeachersPayload(BaseModel):
    """
    Payload model for assigning teachers to a group
    """
    group_id: int
    teacher_ids: list[str]


class UnassignStudentsPayload(BaseModel):
    """
    Payload model for unassigning students from a group
    """
    student_ids: list[str]


class UnassignTeachersPayload(BaseModel):
    """
    Payload model for unassigning teachers from a group
    """
    group_id: int
    teacher_ids: list[str]

