from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import PointIdsList

from app.models.post_orm import PostORM


class PostRepository:
    def __init__(self, client: QdrantClient, collection_name: str) -> None:
        self._client = client
        self._collection_name = collection_name

    def create(self, post: PostORM) -> PostORM:
        self._client.upsert(
            collection_name=self._collection_name,
            points=[post.to_point()],
            wait=True,
        )
        return post

    def get_by_id(self, post_id: str) -> PostORM | None:
        records = self._client.retrieve(
            collection_name=self._collection_name,
            ids=[post_id],
            with_payload=True,
            with_vectors=True,
        )

        if not records:
            return None

        return PostORM.from_qdrant_record(records[0])

    def list_posts(self, limit: int = 20, offset: Any = None) -> tuple[list[PostORM], str | None]:
        records, next_offset = self._client.scroll(
            collection_name=self._collection_name,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=True,
        )

        items = [PostORM.from_qdrant_record(record) for record in records]
        next_value = str(next_offset) if next_offset is not None else None
        return items, next_value

    def update(self, post: PostORM) -> PostORM | None:
        if self.get_by_id(post.id) is None:
            return None

        self._client.upsert(
            collection_name=self._collection_name,
            points=[post.to_point()],
            wait=True,
        )
        return post

    def semantic_search(
        self,
        query_vector: list[float],
        top_k: int,
        min_score: float | None = None,
    ) -> list[tuple[PostORM, float]]:
        results = self._client.search(
            collection_name=self._collection_name,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=min_score,
            with_payload=True,
            with_vectors=True,
        )

        items: list[tuple[PostORM, float]] = []
        for result in results:
            post = PostORM.from_qdrant_record(result)
            items.append((post, float(result.score)))

        return items

    def semantic_search_raw(
        self,
        query_vector: list[float],
        top_k: int,
        min_score: float | None = None,
    ) -> list[dict[str, Any]]:
        results = self._client.search(
            collection_name=self._collection_name,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=min_score,
            with_payload=True,
            with_vectors=False,
        )

        items: list[dict[str, Any]] = []
        for result in results:
            payload = result.payload or {}
            items.append(
                {
                    "id": str(result.id),
                    "title": payload.get("title", ""),
                    "content": payload.get("content", ""),
                    "tags": payload.get("tags", []),
                    "created_at": payload.get("created_at"),
                    "updated_at": payload.get("updated_at"),
                    "score": float(result.score),
                }
            )

        return items

    def delete(self, post_id: str) -> bool:
        if self.get_by_id(post_id) is None:
            return False

        self._client.delete(
            collection_name=self._collection_name,
            points_selector=PointIdsList(points=[post_id]),
            wait=True,
        )
        return True
