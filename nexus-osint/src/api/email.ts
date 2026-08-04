import { fetchSearchResult } from "./shared";

export async function searchEmail(query: string) {
  return fetchSearchResult(query, "email");
}
