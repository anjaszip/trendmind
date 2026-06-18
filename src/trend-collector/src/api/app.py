import logging
import os

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.collectors.google_trends import GoogleTrendsCollector
from src.collectors.youtube_trends import YouTubeCollector
from src.models.trend_data import HealthResponse, TrendData

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TrendMind Trend Collector", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET"],
    allow_headers=["*"],
)

_google_collector = GoogleTrendsCollector()
_youtube_collector = YouTubeCollector()


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/collect/google-trends", response_model=TrendData)
async def collect_google_trends(
    keyword: str = Query(..., min_length=1, max_length=100),
    timeframe: str = Query(default="today 3-m"),
) -> TrendData:
    if not keyword.strip():
        raise HTTPException(status_code=422, detail="keyword must not be blank")
    result = _google_collector.collect(keyword, timeframe=timeframe)
    if result.collection_status == "failed":
        raise HTTPException(status_code=502, detail=result.error_message)
    return result


@app.get("/collect/youtube", response_model=TrendData)
async def collect_youtube(
    keyword: str = Query(..., min_length=1, max_length=100),
) -> TrendData:
    if not keyword.strip():
        raise HTTPException(status_code=422, detail="keyword must not be blank")
    result = _youtube_collector.collect(keyword)
    if result.collection_status == "failed":
        raise HTTPException(status_code=502, detail=result.error_message)
    return result
