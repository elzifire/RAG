from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from app.core.config import settings


qdrant_client = QdrantClient(url=settings.qdrant_url)


def ensure_collection() -> None:
    if qdrant_client.collection_exists(settings.qdrant_collection):
        return

    qdrant_client.create_collection(
        collection_name=settings.qdrant_collection,
        vectors_config=VectorParams(
            size=settings.qdrant_vector_size,
            distance=Distance.COSINE,
        ),
    )
