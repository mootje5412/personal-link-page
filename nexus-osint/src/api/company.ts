import { fetchSearchResult } from "./shared";

export async function searchCompany(query: string) {
  return fetchSearchResult(query, "company");
}
