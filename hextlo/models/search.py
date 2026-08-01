from dataclasses import dataclass, field
from enum import Enum
from typing import Any

FIELD_ORDER = (
    "SSN",
    "DOB",
    "Phone",
    "Mobile",
    "Email",
    "Address",
    "City",
    "State",
    "ZIP",
    "Age",
    "Sex",
    "Height",
    "Weight",
    "Offense",
    "Offense Code",
    "Charges Filed",
    "Agency",
    "Id",
)


class SearchType(str, Enum):
    SSN = "ssnsearch"
    VIN = "vinsearch"
    CRIMINAL = "criminal-lookup"
    INTELIUS = "intelius"
    MOBILE = "Million_Mobile"
    ODIDO = "full_odido"
    PERSON = "person-lookup"
    NAME = "name"


SEARCH_LABELS: dict[SearchType, str] = {
    SearchType.SSN: "SSN Search",
    SearchType.VIN: "VIN Search",
    SearchType.CRIMINAL: "Criminal Lookup",
    SearchType.INTELIUS: "Intelius Search",
    SearchType.MOBILE: "Phone Search",
    SearchType.ODIDO: "Odido Search",
    SearchType.PERSON: "NPD Search",
    SearchType.NAME: "Name Search",
}


@dataclass
class DetectedSearch:
    search_type: SearchType
    api_query: str
    display_query: str
    label: str = ""
    name_first: str = ""
    name_last: str = ""
    name_state: str = ""
    name_zip: str = ""
    name_city: str = ""


@dataclass
class SearchRequest:
    detected: DetectedSearch
    user_id: int


@dataclass
class SearchResult:
    title: str
    fields: dict[str, str] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)

    def to_text(self) -> str:
        lines = [self.title]
        shown: set[str] = set()

        for key in FIELD_ORDER:
            value = self.fields.get(key)
            if value:
                lines.append(f"  {key}: {value}")
                shown.add(key)

        for key, value in self.fields.items():
            if key not in shown and value:
                lines.append(f"  {key}: {value}")

        return "\n".join(lines)


@dataclass
class SearchResponse:
    search_type: SearchType
    query: str
    results: list[SearchResult] = field(default_factory=list)
    total: int = 0
    api_connected: bool = True
    message: str = ""
    label: str = ""
    raw: Any = None

    @property
    def count(self) -> int:
        return self.total or len(self.results)
