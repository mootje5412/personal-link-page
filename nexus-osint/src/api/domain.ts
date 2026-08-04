import { fetchSearchResult } from "./shared";

export async function searchDomain(query: string) {
  return fetchSearchResult(query, "domain");
}
