import { fetchSearchResult } from "./shared";

export async function searchPhone(query: string) {
  return fetchSearchResult(query, "phone");
}
