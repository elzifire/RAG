import hashlib
import math


def text_to_vector(text: str, size: int) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    vector = []

    for index in range(size):
        raw_value = digest[index % len(digest)]
        vector.append((raw_value / 127.5) - 1.0)

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector

    return [value / norm for value in vector]
