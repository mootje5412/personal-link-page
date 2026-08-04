export type SearchType =
  | "username"
  | "email"
  | "domain"
  | "ip"
  | "phone"
  | "hash"
  | "company";

export interface SearchRecord {
  id: string;
  query: string;
  type: SearchType;
  createdAt: string;
  pinned?: boolean;
  favorite?: boolean;
}

export interface SocialProfile {
  platform: string;
  username: string;
  url: string;
  verified: boolean;
  followers?: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: "info" | "warning" | "critical";
}

export interface SearchResult {
  query: string;
  type: SearchType;
  riskScore: number;
  summary: string;
  metadata: { label: string; value: string }[];
  socialProfiles: SocialProfile[];
  relatedUsernames: string[];
  connectedDomains: string[];
  technologyStack: string[];
  timeline: TimelineEvent[];
  publicInfo: string[];
  location?: { lat: number; lng: number; label: string };
}

export const SEARCH_PLACEHOLDERS: Record<SearchType, string> = {
  username: "Enter username — e.g. johndoe, @handle...",
  email: "Enter email — e.g. user@company.com...",
  domain: "Enter domain — e.g. example.com...",
  ip: "Enter IP address — e.g. 192.168.1.1...",
  phone: "Enter phone — e.g. +1 555 0100...",
  hash: "Enter hash — MD5, SHA256...",
  company: "Enter company name — e.g. Acme Corp...",
};

export const SEARCH_LABELS: Record<SearchType, string> = {
  username: "Username",
  email: "Email",
  domain: "Domain",
  ip: "IP Address",
  phone: "Phone",
  hash: "Hash",
  company: "Company",
};
