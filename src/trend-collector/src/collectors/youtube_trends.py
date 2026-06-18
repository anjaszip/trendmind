import logging
import os
from datetime import datetime
from typing import Any

from googleapiclient.discovery import build

from src.models.trend_data import TrendData

logger = logging.getLogger(__name__)


class YouTubeCollector:
    MAX_RESULTS = 50

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("YOUTUBE_API_KEY", "")
        self.youtube = build("youtube", "v3", developerKey=self.api_key)

    def collect(self, keyword: str) -> TrendData:
        try:
            search_response = (
                self.youtube.search()
                .list(
                    q=keyword,
                    part="id",
                    type="video",
                    order="viewCount",
                    maxResults=self.MAX_RESULTS,
                    publishedAfter="2024-01-01T00:00:00Z",
                )
                .execute()
            )

            video_ids = [
                item["id"]["videoId"]
                for item in search_response.get("items", [])
                if item.get("id", {}).get("videoId")
            ]
            total_results = search_response.get("pageInfo", {}).get("totalResults", len(video_ids))

            videos: list[dict[str, Any]] = []
            if video_ids:
                stats_response = (
                    self.youtube.videos()
                    .list(part="snippet,statistics", id=",".join(video_ids))
                    .execute()
                )
                for item in stats_response.get("items", []):
                    stats = item.get("statistics", {})
                    videos.append(
                        {
                            "video_id": item["id"],
                            "channel_id": item.get("snippet", {}).get("channelId"),
                            "view_count": int(stats.get("viewCount", 0)),
                            "like_count": int(stats.get("likeCount", 0)),
                            "comment_count": int(stats.get("commentCount", 0)),
                        }
                    )

            view_count = sum(v["view_count"] for v in videos)
            unique_creators = len({v["channel_id"] for v in videos if v["channel_id"]})
            total_likes = sum(v["like_count"] for v in videos)
            total_comments = sum(v["comment_count"] for v in videos)
            engagement_rate = (
                min((total_likes + total_comments) / view_count, 0.1) if view_count > 0 else None
            )

            return TrendData(
                keyword=keyword,
                provider="youtube",
                collected_at=datetime.utcnow(),
                video_count=total_results,
                view_count=view_count,
                unique_creators=unique_creators,
                engagement_rate=engagement_rate,
                raw_response={"videos": videos, "total_results": total_results},
                collection_status="success",
            )
        except Exception as exc:
            logger.error("YouTube collection failed for '%s': %s", keyword, exc)
            return TrendData(
                keyword=keyword,
                provider="youtube",
                collection_status="failed",
                error_message=str(exc),
            )
