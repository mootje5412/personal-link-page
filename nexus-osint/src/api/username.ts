import { fetchSearchResult } from "./shared";

export async function searchUsername(query: string) {
  return fetchSearchResult(query, "username");
}
