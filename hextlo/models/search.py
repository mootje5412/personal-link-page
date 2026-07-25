from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class SearchType(str, Enum):
    SSN = "ssn"
    NAME = "name"
    NPD = "npd"
    COURT = "court"
    PHONE = "phone"
    EMAIL = "email"
    ADDRESS = "address"


@dataclass
class SearchRequest:
    search_type: SearchType
    query: str
    user_id: int
    extra: dict[str, str] = field(default_factory=dict)


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
    api_connected: bool = False
    message: str = ""

    @property
    def count(self) -> int:
        return self.total or len(self.results)
