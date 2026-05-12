from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.controllers.post_controller import get_post_service, router
from app.models.post import PostSearchItem


class FakePostService:
    def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float | None = None,
    ) -> list[PostSearchItem]:
        now = datetime.now(timezone.utc)
        return [
            PostSearchItem(
                id="s-1",
                title=f"Result for {query}",
                content="Sample semantic content",
                tags=["search", "unit-test"],
                created_at=now,
                updated_at=now,
                score=0.88,
            )
        ][:top_k]

    def semantic_search_without_orm(
        self,
        query: str,
        top_k: int = 5,
        min_score: float | None = None,
    ) -> list[PostSearchItem]:
        now = datetime.now(timezone.utc)
        return [
            PostSearchItem(
                id="raw-1",
                title=f"Raw result for {query}",
                content="Sample raw semantic content",
                tags=["search", "raw"],
                created_at=now,
                updated_at=now,
                score=0.91,
            )
        ][:top_k]


def create_test_client() -> TestClient:
    test_app = FastAPI()
    test_app.include_router(router, prefix="/api/v1")
    test_app.dependency_overrides[get_post_service] = lambda: FakePostService()
    return TestClient(test_app)


def test_semantic_search_with_orm_endpoint_returns_items() -> None:
    client = create_test_client()

    response = client.post(
        "/api/v1/posts/search/semantic/orm",
        json={"query": "qdrant", "top_k": 1, "min_score": 0},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["using_orm"] is True
    assert data["search_mode"] == "orm"
    assert data["query"] == "qdrant"
    assert data["top_k"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == "s-1"


def test_semantic_search_without_orm_endpoint_returns_items() -> None:
    client = create_test_client()

    response = client.post(
        "/api/v1/posts/search/semantic/non-orm",
        json={"query": "qdrant", "top_k": 1},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["using_orm"] is False
    assert data["search_mode"] == "non_orm"
    assert len(data["items"]) == 1
    assert data["items"][0]["id"] == "raw-1"


def test_semantic_search_endpoint_validates_top_k() -> None:
    client = create_test_client()

    response = client.post(
        "/api/v1/posts/search/semantic/orm",
        json={"query": "qdrant", "top_k": 0},
    )

    assert response.status_code == 422
