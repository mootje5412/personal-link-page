import { fetchSearchResult } from "./shared";

export async function searchIp(query: string) {
  return fetchSearchResult(query, "ip");
}
