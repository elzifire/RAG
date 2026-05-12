from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PostBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=1)
    tags: list[str] = Field(default_factory=list)


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    tags: list[str] | None = None


class PostRead(PostBase):
    id: str
    created_at: datetime
    updated_at: datetime


class PostListResponse(BaseModel):
    items: list[PostRead]
    next_offset: str | None = None


class PostSearchItem(PostRead):
    score: float


class PostSearchRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = Field(default=5, ge=1, le=50)
    min_score: float | None = None


class PostSearchResponse(BaseModel):
    using_orm: bool
    search_mode: Literal["orm", "non_orm"]
    query: str
    top_k: int
    min_score: float | None = None
    items: list[PostSearchItem]


class PostDeleteResponse(BaseModel):
    message: str
