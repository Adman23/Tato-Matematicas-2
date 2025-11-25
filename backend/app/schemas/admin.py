"""
Admin schemas

This module defines schemas for managing teachers and students in groups.

"""

from pydantic import BaseModel

class User(BaseModel):
    """
    !! NEW 
        -> Unifies student, teacher and admin
        -> Has the same structure as User in the front
    User data model.
    Contains all the basic data of a user.
    """
    id: str
    username: str
    role: str
    photo_url: str | None = None
    group_id: str | None = None
    
    model_config = {"from_attributes": True}


"""
!! DEPRECATED 1.2.0
    -> Its the same as a Student, different role
class Teacher(BaseModel):
    
    Teacher data model
    
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "teacher"

    model_config = {"from_attributes": True}
"""

"""
!! DEPRECATED 1.2.0
    -> Its the same as a Teacher, different role
class Student(BaseModel):
    
    Student data model
    
    id: str
    name: str
    avatar_url: str | None = None
    role: str = "student"

    model_config = {"from_attributes": True}
"""

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

