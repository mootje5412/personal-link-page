from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class SearchType(str, Enum):
    SSN = "ssnsearch"
    VIN = "vinsearch"
    CRIMINAL = "criminal-lookup"
    INTELIUS = "intelius"
    MOBILE = "Million_Mobile"


SEARCH_LABELS: dict[SearchType, str] = {
    SearchType.SSN: "SSN Search",
    SearchType.VIN: "VIN Search",
    SearchType.CRIMINAL: "Criminal Lookup",
    SearchType.INTELIUS: "Intelius",
    SearchType.MOBILE: "Mobile Lookup",
}


@dataclass
class DetectedSearch:
    search_type: SearchType
    api_query: str
    display_query: str
    label: str = ""


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
        if not self.fields:
            return self.title
        lines = [self.title]
        for key, value in self.fields.items():
            if value:
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
