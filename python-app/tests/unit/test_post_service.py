from datetime import datetime, timezone
from unittest.mock import MagicMock

from app.core.config import settings
from app.models.post import PostCreate
from app.models.post_orm import PostORM
from app.services.post_service import PostService


def make_post_orm() -> PostORM:
    now = datetime.now(timezone.utc)
    return PostORM(
        id="post-1",
        title="Belajar FastAPI",
        content="Konten belajar FastAPI dan Qdrant",
        tags=["fastapi", "qdrant"],
        created_at=now,
        updated_at=now,
        vector=[0.1] * settings.qdrant_vector_size,
    )


def test_create_post_calls_repository_create_and_returns_read_model() -> None:
    repository = MagicMock()
    repository.create.side_effect = lambda post: post

    service = PostService(repository=repository)
    payload = PostCreate(
        title="Belajar MVC",
        content="Pisahkan controller, service, repository",
        tags=["mvc", "clean-code"],
    )

    result = service.create_post(payload)

    assert result.title == payload.title
    assert result.content == payload.content
    assert result.tags == payload.tags

    repository.create.assert_called_once()
    created_post = repository.create.call_args.args[0]
    assert len(created_post.vector) == settings.qdrant_vector_size


def test_semantic_search_maps_repository_result_to_search_item() -> None:
    repository = MagicMock()
    repository.semantic_search.return_value = [(make_post_orm(), 0.9123)]

    service = PostService(repository=repository)
    items = service.semantic_search(query="fastapi qdrant", top_k=3)

    assert len(items) == 1
    assert items[0].id == "post-1"
    assert items[0].score == 0.9123

    repository.semantic_search.assert_called_once()
    call_kwargs = repository.semantic_search.call_args.kwargs
    assert call_kwargs["top_k"] == 3
    assert call_kwargs["min_score"] is None
    assert len(call_kwargs["query_vector"]) == settings.qdrant_vector_size


def test_semantic_search_without_orm_maps_raw_result() -> None:
    repository = MagicMock()
    now = datetime.now(timezone.utc).isoformat()
    repository.semantic_search_raw.return_value = [
        {
            "id": "raw-1",
            "title": "Raw result",
            "content": "Raw payload mapping",
            "tags": ["raw", "search"],
            "created_at": now,
            "updated_at": now,
            "score": 0.77,
        }
    ]

    service = PostService(repository=repository)
    items = service.semantic_search_without_orm(query="raw query", top_k=2, min_score=0.5)

    assert len(items) == 1
    assert items[0].id == "raw-1"
    assert items[0].score == 0.77

    repository.semantic_search_raw.assert_called_once()
    call_kwargs = repository.semantic_search_raw.call_args.kwargs
    assert call_kwargs["top_k"] == 2
    assert call_kwargs["min_score"] == 0.5
