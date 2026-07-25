from config.settings import settings
from models.search import SearchRequest, SearchResponse, SearchType
from services.base import BaseSearchService


class SsnSearchService(BaseSearchService):
    search_type = SearchType.SSN
    api_env_key = "ssn_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.ssn_api_url)


class NameSearchService(BaseSearchService):
    search_type = SearchType.NAME
    api_env_key = "name_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.name_api_url)


class NpdSearchService(BaseSearchService):
    search_type = SearchType.NPD
    api_env_key = "npd_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.npd_api_url)


class CourtSearchService(BaseSearchService):
    search_type = SearchType.COURT
    api_env_key = "court_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.court_api_url)


class PhoneSearchService(BaseSearchService):
    search_type = SearchType.PHONE
    api_env_key = "phone_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.phone_api_url)


class EmailSearchService(BaseSearchService):
    search_type = SearchType.EMAIL
    api_env_key = "email_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.email_api_url)


class AddressSearchService(BaseSearchService):
    search_type = SearchType.ADDRESS
    api_env_key = "address_api_url"

    async def search(self, request: SearchRequest) -> SearchResponse:
        return self._stub_response(request, settings.address_api_url)
