from models.search import DetectedSearch, SearchResponse
from services.zopztlo_client import ZopzTloClient

_client = ZopzTloClient()


async def run_detected_search(detected: DetectedSearch, user_id: int) -> SearchResponse:
    return await _client.search(detected)
