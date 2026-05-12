from datetime import datetime
from typing import Any

from pydantic import BaseModel
from qdrant_client.models import PointStruct


class PostORM(BaseModel):
    id: str
    title: str
    content: str
    tags: list[str]
    created_at: datetime
    updated_at: datetime
    vector: list[float]

    def to_payload(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "content": self.content,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_point(self) -> PointStruct:
        return PointStruct(id=self.id, vector=self.vector, payload=self.to_payload())

    @classmethod
    def from_qdrant_record(cls, record: Any) -> "PostORM":
        payload = record.payload or {}
        vector = record.vector or []

        if isinstance(vector, dict):
            vector = next(iter(vector.values()), [])

        return cls(
            id=str(record.id),
            title=payload.get("title", ""),
            content=payload.get("content", ""),
            tags=payload.get("tags", []),
            created_at=datetime.fromisoformat(payload["created_at"]),
            updated_at=datetime.fromisoformat(payload["updated_at"]),
            vector=list(vector),
        )
