import random

from scripts.seed_random_posts import build_random_post, validate_count


def test_build_random_post_meets_schema_requirements() -> None:
    payload = build_random_post(random.Random(7))

    assert len(payload.title) >= 3
    assert len(payload.content) >= 1
    assert len(payload.tags) >= 2


def test_validate_count_raises_when_invalid() -> None:
    try:
        validate_count(0)
    except ValueError as exc:
        assert "minimal 1" in str(exc)
        return

    raise AssertionError("validate_count should raise ValueError for count=0")
