from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.controllers.post_controller import router as post_router
from app.core.config import settings
from app.core.qdrant import ensure_collection


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_collection()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Simple CRUD API untuk belajar FastAPI + Qdrant dengan pola MVC.",
    lifespan=lifespan,
)


@app.get("/")
def health_check() -> dict[str, str]:
    return {
        "message": "API is running",
        "docs": "/docs",
    }


app.include_router(post_router, prefix=settings.api_v1_prefix)
