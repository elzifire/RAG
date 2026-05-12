from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import settings
from app.core.qdrant import qdrant_client
from app.models.post import (
    PostCreate,
    PostDeleteResponse,
    PostListResponse,
    PostRead,
    PostSearchRequest,
    PostSearchResponse,
    PostUpdate,
)
from app.repositories.post_repository import PostRepository
from app.services.post_service import PostService


router = APIRouter(prefix="/posts", tags=["Posts"])
post_repository = PostRepository(client=qdrant_client, collection_name=settings.qdrant_collection)


def get_post_service() -> PostService:
    return PostService(repository=post_repository)


@router.post("/", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, service: PostService = Depends(get_post_service)) -> PostRead:
    return service.create_post(payload)


@router.get("/", response_model=PostListResponse)
def list_posts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: str | None = Query(default=None),
    service: PostService = Depends(get_post_service),
) -> PostListResponse:
    items, next_offset = service.list_posts(limit=limit, offset=offset)
    return PostListResponse(items=items, next_offset=next_offset)


@router.post("/search/semantic/orm", response_model=PostSearchResponse)
def semantic_search_posts_with_orm(
    payload: PostSearchRequest,
    service: PostService = Depends(get_post_service),
) -> PostSearchResponse:
    items = service.semantic_search(
        query=payload.query,
        top_k=payload.top_k,
        min_score=payload.min_score,
    )
    return PostSearchResponse(
        using_orm=True,
        search_mode="orm",
        query=payload.query,
        top_k=payload.top_k,
        min_score=payload.min_score,
        items=items,
    )


@router.post("/search/semantic/non-orm", response_model=PostSearchResponse)
def semantic_search_posts_without_orm(
    payload: PostSearchRequest,
    service: PostService = Depends(get_post_service),
) -> PostSearchResponse:
    items = service.semantic_search_without_orm(
        query=payload.query,
        top_k=payload.top_k,
        min_score=payload.min_score,
    )
    return PostSearchResponse(
        using_orm=False,
        search_mode="non_orm",
        query=payload.query,
        top_k=payload.top_k,
        min_score=payload.min_score,
        items=items,
    )


@router.get("/{post_id}", response_model=PostRead)
def get_post(post_id: str, service: PostService = Depends(get_post_service)) -> PostRead:
    post = service.get_post(post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    return post


@router.put("/{post_id}", response_model=PostRead)
def update_post(post_id: str, payload: PostUpdate, service: PostService = Depends(get_post_service)) -> PostRead:
    post = service.update_post(post_id, payload)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    return post


@router.delete("/{post_id}", response_model=PostDeleteResponse)
def delete_post(post_id: str, service: PostService = Depends(get_post_service)) -> PostDeleteResponse:
    deleted = service.delete_post(post_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    return PostDeleteResponse(message="Post deleted successfully")
