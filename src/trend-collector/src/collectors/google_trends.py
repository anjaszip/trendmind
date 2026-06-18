import logging
from datetime import datetime
from typing import Any

from pytrends.request import TrendReq

from src.models.trend_data import TrendData
from src.normalizer.keyword_normalizer import normalize_keyword

logger = logging.getLogger(__name__)


class GoogleTrendsCollector:
    def __init__(self, hl: str = "en-US", tz: int = 360, timeout: tuple[int, int] = (10, 30)):
        self.pytrends = TrendReq(hl=hl, tz=tz, timeout=timeout, retries=2, backoff_factor=0.5)

    def collect(self, keyword: str, timeframe: str = "today 3-m") -> TrendData:
        normalized = normalize_keyword(keyword)
        try:
            self.pytrends.build_payload([normalized], timeframe=timeframe)
            interest = self.pytrends.interest_over_time()
            related = self.pytrends.related_queries()

            search_volume: int | None = None
            raw_interest: dict[str, Any] = {}
            if not interest.empty and normalized in interest.columns:
                search_volume = int(interest[normalized].iloc[-1])
                raw_interest = interest.tail(7).to_dict()

            related_queries: list[str] = []
            breakout_queries: list[str] = []
            raw_related: dict[str, Any] = {}
            if normalized in related:
                rising = related[normalized].get("rising")
                if rising is not None and not rising.empty:
                    for _, row in rising.iterrows():
                        query = str(row.get("query", ""))
                        value = row.get("value", "")
                        related_queries.append(query)
                        if str(value).lower() == "breakout":
                            breakout_queries.append(query)
                    raw_related = rising.to_dict()

            return TrendData(
                keyword=keyword,
                provider="google_trends",
                collected_at=datetime.utcnow(),
                search_volume=search_volume,
                related_queries=related_queries,
                breakout_queries=breakout_queries,
                raw_response={"interest_over_time": raw_interest, "related_queries": raw_related},
                collection_status="success",
            )
        except Exception as exc:
            logger.error("Google Trends collection failed for '%s': %s", keyword, exc)
            return TrendData(
                keyword=keyword,
                provider="google_trends",
                collection_status="failed",
                error_message=str(exc),
            )
