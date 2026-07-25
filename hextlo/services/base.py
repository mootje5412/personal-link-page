from abc import ABC, abstractmethod

from models.search import SearchRequest, SearchResponse, SearchType


class BaseSearchService(ABC):
    search_type: SearchType
    api_env_key: str

    @abstractmethod
    async def search(self, request: SearchRequest) -> SearchResponse:
        raise NotImplementedError

    def _stub_response(self, request: SearchRequest, api_url: str) -> SearchResponse:
        if api_url:
            return SearchResponse(
                search_type=self.search_type,
                query=request.query,
                api_connected=True,
                message="API URL is set but integration is not implemented yet.",
            )
        return SearchResponse(
            search_type=self.search_type,
            query=request.query,
            api_connected=False,
            message="This module is ready. Connect the API to enable live results.",
        )
