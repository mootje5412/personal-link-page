import type { SearchType } from "@/types/search";
import { searchUsername } from "./username";
import { searchEmail } from "./email";
import { searchPhone } from "./phone";
import { searchDomain } from "./domain";
import { searchIp } from "./ip";
import { searchCompany } from "./company";
import { fetchSearchResult } from "./shared";

export async function executeSearch(query: string, type: SearchType) {
  switch (type) {
    case "username": return searchUsername(query);
    case "email": return searchEmail(query);
    case "phone": return searchPhone(query);
    case "domain": return searchDomain(query);
    case "ip": return searchIp(query);
    case "hash": return fetchSearchResult(query, "hash");
    case "company": return searchCompany(query);
    default: return searchUsername(query);
  }
}

export * from "./shared";
export * from "./username";
export * from "./email";
export * from "./phone";
export * from "./domain";
export * from "./ip";
export * from "./company";
