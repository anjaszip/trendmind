from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


class TrendData(BaseModel):
    keyword: str
    provider: str
    collected_at: datetime = Field(default_factory=datetime.utcnow)
    search_volume: Optional[int] = None
    video_count: Optional[int] = None
    view_count: Optional[int] = None
    unique_creators: Optional[int] = None
    engagement_rate: Optional[float] = None
    related_queries: list[str] = Field(default_factory=list)
    breakout_queries: list[str] = Field(default_factory=list)
    raw_response: dict[str, Any] = Field(default_factory=dict)
    collection_status: str = "success"
    error_message: Optional[str] = None

    @field_validator("search_volume")
    @classmethod
    def validate_search_volume(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("search_volume must be between 0 and 100")
        return v

    @field_validator("engagement_rate")
    @classmethod
    def validate_engagement_rate(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            return min(v, 0.1)
        return v


class CollectRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100)
    timeframe: str = Field(default="today 3-m")


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
