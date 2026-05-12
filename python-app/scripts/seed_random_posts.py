import argparse
import random
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings
from app.core.qdrant import ensure_collection, qdrant_client
from app.models.post import PostCreate
from app.repositories.post_repository import PostRepository
from app.services.post_service import PostService


TOPICS = [
    "FastAPI",
    "Qdrant",
    "Python",
    "RAG",
    "Vector Search",
    "Microservice",
    "Testing",
    "Clean Code",
]

TONES = ["praktis", "ringan", "teknis", "pemula-friendly", "hands-on"]

TAG_POOL = [
    "fastapi",
    "qdrant",
    "python",
    "rag",
    "api",
    "testing",
    "mvc",
    "clean-code",
    "vector-db",
]


def build_random_post(rng: random.Random) -> PostCreate:
    topic = rng.choice(TOPICS)
    tone = rng.choice(TONES)
    chapter = rng.randint(1, 20)

    title = f"{topic} Notes #{chapter}"
    content = (
        f"Catatan pembelajaran {topic} dengan gaya {tone}. "
        f"Fokus hari ini: implementasi endpoint, validasi data, dan praktik best practice."
    )
    tags = rng.sample(TAG_POOL, k=rng.randint(2, 4))

    return PostCreate(title=title, content=content, tags=tags)


def seed_posts(count: int, reset: bool, seed: int | None = None) -> int:
    rng = random.Random(seed)

    if reset and qdrant_client.collection_exists(settings.qdrant_collection):
        qdrant_client.delete_collection(settings.qdrant_collection)

    ensure_collection()

    repository = PostRepository(client=qdrant_client, collection_name=settings.qdrant_collection)
    service = PostService(repository=repository)

    for _ in range(count):
        payload = build_random_post(rng)
        service.create_post(payload)

    return count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed random posts into Qdrant collection")
    parser.add_argument("--count", type=int, default=25, help="Total random posts to create")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible data")
    parser.add_argument("--reset", action="store_true", help="Delete and recreate collection before seeding")
    return parser.parse_args()


def validate_count(value: int) -> None:
    if value < 1:
        raise ValueError("--count minimal 1")


def main() -> None:
    args = parse_args()
    validate_count(args.count)

    total = seed_posts(count=args.count, reset=args.reset, seed=args.seed)
    print(f"Seeding selesai. Total post dibuat: {total}")
    print(f"Collection: {settings.qdrant_collection} @ {settings.qdrant_url}")


if __name__ == "__main__":
    main()
