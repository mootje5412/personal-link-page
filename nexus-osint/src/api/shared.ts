import axios from "axios";
import { delay } from "@/lib/utils";
import type { SearchResult } from "@/types/search";

const API_URL = import.meta.env.VITE_API_URL || "";
const API_KEY = import.meta.env.VITE_API_KEY || "";

export const apiClient = axios.create({
  baseURL: API_URL || undefined,
  timeout: 30000,
  headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
});

export const hasApiConfig = Boolean(API_URL && API_KEY);

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

export async function mockSearch(
  query: string,
  type: SearchResult["type"]
): Promise<SearchResult> {
  await delay(1200 + Math.random() * 800);
  const seed = hash(query + type);

  return {
    query,
    type,
    riskScore: 20 + (seed % 75),
    summary: `Intelligence report for "${query}" — ${type} analysis complete. ${seed % 3 === 0 ? "Elevated exposure detected across multiple platforms." : "Standard public footprint identified."}`,
    metadata: [
      { label: "First Seen", value: "2019-03-14" },
      { label: "Last Active", value: "2026-07-28" },
      { label: "Confidence", value: `${70 + (seed % 25)}%` },
      { label: "Sources", value: `${8 + (seed % 12)} databases` },
      { label: "Records", value: `${(seed % 50) + 3}` },
      { label: "Status", value: seed % 2 ? "Active" : "Dormant" },
    ],
    socialProfiles: [
      { platform: "Twitter/X", username: query, url: `https://x.com/${query}`, verified: seed % 3 === 0, followers: `${((seed % 900) + 100) / 10}K` },
      { platform: "GitHub", username: query, url: `https://github.com/${query}`, verified: false, followers: `${seed % 500}` },
      { platform: "LinkedIn", username: query, url: `https://linkedin.com/in/${query}`, verified: seed % 4 === 0 },
      { platform: "Instagram", username: query, url: `https://instagram.com/${query}`, verified: false, followers: `${(seed % 2000) + 100}` },
    ],
    relatedUsernames: [`${query}_official`, `${query}92`, `real_${query}`, `${query}.dev`],
    connectedDomains: [`${query}.com`, `${query}-blog.io`, `mail.${query}.net`],
    technologyStack: ["Cloudflare", "React", "Node.js", "AWS", "Nginx"],
    timeline: [
      { date: "2026-07-28", title: "Recent Activity", description: "Profile updated on social platform", type: "info" },
      { date: "2025-11-02", title: "Domain Registered", description: `New domain linked to ${query}`, type: "warning" },
      { date: "2024-06-15", title: "Data Breach Exposure", description: "Email found in public breach database", type: "warning" },
      { date: "2023-01-08", title: "First Indexed", description: "Initial OSINT footprint detected", type: "info" },
    ],
    publicInfo: [
      "Public profile information available across 4 platforms",
      "Associated with technology sector based on domain analysis",
      "Geolocation data suggests US/EU presence",
      "No dark web mentions in indexed sources",
    ],
    location: { lat: 40.7128 + (seed % 100) / 1000, lng: -74.006 + (seed % 100) / 1000, label: "New York, US (approx.)" },
  };
}

export async function fetchSearchResult(
  query: string,
  type: SearchResult["type"]
): Promise<SearchResult> {
  if (hasApiConfig) {
    const { data } = await apiClient.post("/search", { query, type });
    return data;
  }
  return mockSearch(query, type);
}
