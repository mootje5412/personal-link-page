from models.search import SearchType
from services.search_services import (
    AddressSearchService,
    CourtSearchService,
    EmailSearchService,
    NameSearchService,
    NpdSearchService,
    PhoneSearchService,
    SsnSearchService,
)

SERVICES = {
    SearchType.SSN: SsnSearchService(),
    SearchType.NAME: NameSearchService(),
    SearchType.NPD: NpdSearchService(),
    SearchType.COURT: CourtSearchService(),
    SearchType.PHONE: PhoneSearchService(),
    SearchType.EMAIL: EmailSearchService(),
    SearchType.ADDRESS: AddressSearchService(),
}


async def run_search(search_type: SearchType, query: str, user_id: int, extra: dict | None = None):
    service = SERVICES[search_type]
    from models.search import SearchRequest

    request = SearchRequest(
        search_type=search_type,
        query=query,
        user_id=user_id,
        extra=extra or {},
    )
    return await service.search(request)
