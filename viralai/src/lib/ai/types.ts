export type CaptionTone =
  | "motivational"
  | "luxury"
  | "funny"
  | "business"
  | "fitness"
  | "storytelling";

export type ScriptDuration = "15" | "30" | "60";

export interface CaptionResult {
  caption: string;
  cta: string;
  emojiVersion: string;
  shortVersion: string;
}

export interface VideoIdea {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  viralPotential: number;
  bestUploadTime: string;
}

export interface ScriptResult {
  hook: string;
  body: string;
  ending: string;
  cta: string;
  duration: ScriptDuration;
}

export interface HashtagResult {
  trending: string[];
  niche: string[];
  lowCompetition: string[];
  highReach: string[];
}

export interface AnalyzerResult {
  viralScore: number;
  hookScore: number;
  watchTimePrediction: string;
  engagementPrediction: string;
  improvements: string[];
  suggestedChanges: string[];
}

export interface TrendData {
  niches: { name: string; growth: number; posts: string }[];
  topics: { name: string; volume: string; trend: "up" | "down" | "stable" }[];
  sounds: { name: string; uses: string; platform: string }[];
  hashtags: { tag: string; posts: string; growth: number }[];
}

export interface GenerationRecord {
  id: string;
  type: "caption" | "ideas" | "script" | "hashtags" | "analyze";
  title: string;
  preview: string;
  data: unknown;
  createdAt: string;
  favorite?: boolean;
}

export interface AIRequestOptions {
  topic?: string;
  tone?: CaptionTone;
  duration?: ScriptDuration;
  input?: string;
  inputType?: "caption" | "video-idea";
}

export interface AIResponse<T> {
  data: T;
  usage?: { promptTokens: number; completionTokens: number };
}
