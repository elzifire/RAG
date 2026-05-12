from datetime import datetime, timezone
from uuid import uuid4

from app.core.config import settings
from app.models.post import PostCreate, PostRead, PostSearchItem, PostUpdate
from app.models.post_orm import PostORM
from app.repositories.post_repository import PostRepository
from app.utils.vectorizer import text_to_vector


class PostService:
    def __init__(self, repository: PostRepository) -> None:
        self._repository = repository

    @staticmethod
    def _compose_text(title: str, content: str) -> str:
        return f"{title}\n{content}".strip()

    @staticmethod
    def _to_read_model(post: PostORM) -> PostRead:
        return PostRead(
            id=post.id,
            title=post.title,
            content=post.content,
            tags=post.tags,
            created_at=post.created_at,
            updated_at=post.updated_at,
        )

    @staticmethod
    def _to_search_item(post: PostORM, score: float) -> PostSearchItem:
        return PostSearchItem(
            id=post.id,
            title=post.title,
            content=post.content,
            tags=post.tags,
            created_at=post.created_at,
            updated_at=post.updated_at,
            score=score,
        )

    def create_post(self, payload: PostCreate) -> PostRead:
        now = datetime.now(timezone.utc)
        post_id = str(uuid4())
        vector = text_to_vector(
            self._compose_text(payload.title, payload.content),
            size=settings.qdrant_vector_size,
        )

        post = PostORM(
            id=post_id,
            title=payload.title,
            content=payload.content,
            tags=payload.tags,
            created_at=now,
            updated_at=now,
            vector=vector,
        )

        saved = self._repository.create(post)
        return self._to_read_model(saved)

    def get_post(self, post_id: str) -> PostRead | None:
        post = self._repository.get_by_id(post_id)
        if post is None:
            return None

        return self._to_read_model(post)

    def list_posts(self, limit: int = 20, offset: str | None = None) -> tuple[list[PostRead], str | None]:
        posts, next_offset = self._repository.list_posts(limit=limit, offset=offset)
        return [self._to_read_model(post) for post in posts], next_offset

    def update_post(self, post_id: str, payload: PostUpdate) -> PostRead | None:
        existing = self._repository.get_by_id(post_id)
        if existing is None:
            return None

        new_title = payload.title if payload.title is not None else existing.title
        new_content = payload.content if payload.content is not None else existing.content
        new_tags = payload.tags if payload.tags is not None else existing.tags

        updated = PostORM(
            id=existing.id,
            title=new_title,
            content=new_content,
            tags=new_tags,
            created_at=existing.created_at,
            updated_at=datetime.now(timezone.utc),
            vector=text_to_vector(
                self._compose_text(new_title, new_content),
                size=settings.qdrant_vector_size,
            ),
        )

        result = self._repository.update(updated)
        if result is None:
            return None

        return self._to_read_model(result)

    def delete_post(self, post_id: str) -> bool:
        return self._repository.delete(post_id)

    def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float | None = None,
    ) -> list[PostSearchItem]:
        query_vector = text_to_vector(query, size=settings.qdrant_vector_size)
        results = self._repository.semantic_search(
            query_vector=query_vector,
            top_k=top_k,
            min_score=min_score,
        )
        return [self._to_search_item(post, score) for post, score in results]

    def semantic_search_without_orm(
        self,
        query: str,
        top_k: int = 5,
        min_score: float | None = None,
    ) -> list[PostSearchItem]:
        query_vector = text_to_vector(query, size=settings.qdrant_vector_size)
        results = self._repository.semantic_search_raw(
            query_vector=query_vector,
            top_k=top_k,
            min_score=min_score,
        )
        return [PostSearchItem.model_validate(item) for item in results]
