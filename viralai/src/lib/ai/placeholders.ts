import type {
  AIRequestOptions,
  AIResponse,
  AnalyzerResult,
  CaptionResult,
  CaptionTone,
  HashtagResult,
  ScriptDuration,
  ScriptResult,
  TrendData,
  VideoIdea,
} from "./types";
import { delay } from "../utils";

const toneCaptions: Record<CaptionTone, (topic: string) => CaptionResult> = {
  motivational: (topic) => ({
    caption: `Your ${topic} journey starts with a single step. Every expert was once a beginner who refused to give up. The difference between where you are and where you want to be is the action you take today.`,
    cta: "Save this for when you need a reminder. Follow for daily motivation →",
    emojiVersion: `🔥 Your ${topic} journey starts NOW\n💪 Every expert was once a beginner\n✨ Take action TODAY\n🚀 Follow for daily motivation`,
    shortVersion: `Start your ${topic} journey today. Every expert was once a beginner. Take action now. 🔥`,
  }),
  luxury: (topic) => ({
    caption: `Elevate your ${topic} experience. Crafted for those who appreciate the finer details. Where excellence meets intention, and every moment becomes a statement of refined taste.`,
    cta: "Discover the collection. Link in bio.",
    emojiVersion: `✨ Elevate your ${topic}\n💎 Refined taste\n🥂 Excellence meets intention\n🔗 Link in bio`,
    shortVersion: `Elevate your ${topic}. Where excellence meets intention. ✨`,
  }),
  funny: (topic) => ({
    caption: `POV: You said you'd start ${topic} on Monday... it's been 47 Mondays. 😭 But hey, at least you're here now! That's growth (probably).`,
    cta: "Tag someone who needs to see this 😂 Follow for more chaos",
    emojiVersion: `😭 POV: 47 Mondays later...\n🤡 ${topic} who?\n😂 Tag a friend\n✅ You're here now tho`,
    shortVersion: `47 Mondays later and you're finally starting ${topic}. Progress! 😂`,
  }),
  business: (topic) => ({
    caption: `3 ${topic} strategies that 10x'd our revenue:\n\n1. Focus on value, not volume\n2. Build systems, not shortcuts\n3. Measure what matters\n\nSave this framework for your next strategy session.`,
    cta: "Comment 'GUIDE' for the full playbook →",
    emojiVersion: `📈 3 ${topic} strategies\n1️⃣ Value over volume\n2️⃣ Systems over shortcuts\n3️⃣ Measure what matters\n💬 Comment GUIDE`,
    shortVersion: `3 ${topic} strategies: value over volume, systems over shortcuts, measure what matters. 📈`,
  }),
  fitness: (topic) => ({
    caption: `No excuses. Just ${topic}.\n\n🔥 Warm up: 5 min\n💪 Main set: Push your limits\n🧘 Cool down: Recovery is key\n\nYour body can stand almost anything. It's your mind you have to convince.`,
    cta: "Save this workout. DM 'PLAN' for a custom program →",
    emojiVersion: `🏋️ ${topic} time!\n🔥 Warm up\n💪 Push limits\n🧘 Recover\n💬 DM PLAN`,
    shortVersion: `No excuses. Just ${topic}. Push your limits today. 💪`,
  }),
  storytelling: (topic) => ({
    caption: `I never thought ${topic} would change my life.\n\nThree years ago, I was stuck. Frustrated. Ready to quit.\n\nThen one small decision changed everything.\n\nHere's what happened... 👇`,
    cta: "Read the full story in comments. Follow for Part 2 →",
    emojiVersion: `📖 My ${topic} story\n😔 I was stuck\n✨ One decision changed everything\n👇 Read below\n➡️ Follow for Part 2`,
    shortVersion: `One small ${topic} decision changed everything. Here's my story... 📖`,
  }),
};

const ideaTemplates = [
  "Day in my life as a {topic} creator",
  "Things I wish I knew before starting {topic}",
  "POV: You're a {topic} expert for 24 hours",
  "Rating {topic} trends from 1-10",
  "{topic} mistakes everyone makes (and how to fix them)",
  "I tried {topic} for 30 days — here's what happened",
  "Unpopular {topic} opinions that are actually true",
  "How I went from 0 to 100K with {topic}",
  "{topic} hack that changed my life",
  "Reacting to viral {topic} content",
  "Behind the scenes of my {topic} process",
  "{topic} vs reality — expectation vs actual",
  "5 {topic} tools you need in 2026",
  "Why everyone is wrong about {topic}",
  "My {topic} morning routine that went viral",
  "Testing viral {topic} trends so you don't have to",
  "{topic} transformation — before and after",
  "What $100 vs $10,000 {topic} looks like",
  "I asked 100 people about {topic} — results shocked me",
  "The {topic} algorithm secret nobody talks about",
];

const difficulties: VideoIdea["difficulty"][] = ["Easy", "Medium", "Hard"];
const uploadTimes = [
  "Tuesday 7:00 PM",
  "Wednesday 12:00 PM",
  "Thursday 6:00 PM",
  "Friday 5:00 PM",
  "Saturday 10:00 AM",
  "Sunday 8:00 PM",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function generateCaption(
  topic: string,
  tone: CaptionTone
): Promise<AIResponse<CaptionResult>> {
  await delay(1200 + Math.random() * 800);
  const generator = toneCaptions[tone];
  return { data: generator(topic || "content creation") };
}

export async function generateVideoIdeas(
  topic: string
): Promise<AIResponse<VideoIdea[]>> {
  await delay(1500 + Math.random() * 1000);
  const seed = hashString(topic || "viral");
  const ideas: VideoIdea[] = ideaTemplates.map((template, i) => ({
    id: i + 1,
    title: template.replace("{topic}", topic || "content"),
    difficulty: difficulties[(seed + i) % 3],
    viralPotential: 55 + ((seed + i * 7) % 45),
    bestUploadTime: uploadTimes[(seed + i) % uploadTimes.length],
  }));
  return { data: ideas };
}

export async function generateScript(
  topic: string,
  duration: ScriptDuration
): Promise<AIResponse<ScriptResult>> {
  await delay(1300 + Math.random() * 900);
  const hooks: Record<ScriptDuration, string> = {
    "15": `Stop scrolling. This ${topic} tip takes 15 seconds and could change everything.`,
    "30": `Nobody talks about this ${topic} secret. I discovered it by accident, and it doubled my results.`,
    "60": `Three months ago, I knew nothing about ${topic}. Today, I'm going to share the exact framework that changed everything.`,
  };
  const bodies: Record<ScriptDuration, string> = {
    "15": `Here's the one thing: focus on consistency over perfection. Show up every day, even when it's hard. That's the real ${topic} hack.`,
    "30": `Step one: identify your unique angle. Step two: create content that solves one specific problem. Step three: engage authentically. This ${topic} framework works because it's simple and repeatable.`,
    "60": `Let me break this down. First, I spent weeks researching ${topic} without taking action. Big mistake. Then I started posting daily, even when the content wasn't perfect. I analyzed what worked, doubled down on it, and built systems around my best-performing content. The key insight? Your audience wants authenticity, not perfection.`,
  };
  return {
    data: {
      hook: hooks[duration],
      body: bodies[duration],
      ending: `So if you're serious about ${topic}, start today. Not tomorrow. Today.`,
      cta: "Follow for more tips like this. Save this video for later.",
      duration,
    },
  };
}

export async function generateHashtags(
  topic: string
): Promise<AIResponse<HashtagResult>> {
  await delay(1000 + Math.random() * 600);
  const base = (topic || "viral").replace(/\s+/g, "").toLowerCase();
  return {
    data: {
      trending: [`#${base}`, "#viral", "#fyp", "#trending", "#explore", "#foryou"],
      niche: [`#${base}tips`, `#${base}community`, `#${base}creator`, `#${base}life`, `#${base}hacks`],
      lowCompetition: [`#${base}daily`, `#${base}journey2026`, `#${base}beginner`, `#learn${base}`, `#${base}motivation`],
      highReach: ["#reels", "#instagram", "#contentcreator", "#socialmedia", "#digitalmarketing"],
    },
  };
}

export async function analyzeContent(
  input: string,
  inputType: "caption" | "video-idea"
): Promise<AIResponse<AnalyzerResult>> {
  await delay(1800 + Math.random() * 1000);
  const seed = hashString(input);
  const hasHook = input.length > 20 && (input.includes("?") || input.includes("!") || input.startsWith("POV"));
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(input);
  const hasCTA = /follow|comment|save|link|dm|share/i.test(input);

  const hookScore = hasHook ? 75 + (seed % 20) : 40 + (seed % 30);
  const viralScore = Math.min(100, hookScore + (hasEmoji ? 10 : 0) + (hasCTA ? 15 : 0) + (input.length > 50 ? 5 : 0));

  const improvements: string[] = [];
  const suggestedChanges: string[] = [];

  if (!hasHook) {
    improvements.push("Add a stronger hook in the first line to stop the scroll");
    suggestedChanges.push("Start with a question or bold statement");
  }
  if (!hasEmoji) {
    improvements.push("Include 2-3 relevant emojis for visual appeal");
    suggestedChanges.push("Add emojis to break up text and add personality");
  }
  if (!hasCTA) {
    improvements.push("Include a clear call-to-action");
    suggestedChanges.push("End with 'Follow for more' or 'Save this for later'");
  }
  if (input.length < 50) {
    improvements.push("Expand content for better algorithm performance");
    suggestedChanges.push("Add a story element or personal anecdote");
  }
  if (inputType === "video-idea" && !input.includes(":")) {
    improvements.push("Make the video concept more specific and actionable");
  }

  if (improvements.length === 0) {
    improvements.push("Content is well-optimized — consider A/B testing variations");
    suggestedChanges.push("Try posting at peak hours (6-9 PM) for maximum reach");
  }

  return {
    data: {
      viralScore,
      hookScore,
      watchTimePrediction: viralScore > 70 ? "65-85%" : viralScore > 50 ? "45-65%" : "25-45%",
      engagementPrediction: viralScore > 70 ? "High (4-8%)" : viralScore > 50 ? "Medium (2-4%)" : "Low (1-2%)",
      improvements,
      suggestedChanges,
    },
  };
}

export async function getTrends(): Promise<AIResponse<TrendData>> {
  await delay(800);
  return {
    data: {
      niches: [
        { name: "AI Tools", growth: 342, posts: "2.4M" },
        { name: "Micro Fitness", growth: 218, posts: "890K" },
        { name: "Quiet Luxury", growth: 187, posts: "1.1M" },
        { name: "Side Hustles", growth: 156, posts: "3.2M" },
        { name: "Digital Nomad", growth: 134, posts: "780K" },
      ],
      topics: [
        { name: "Morning routines", volume: "12.4M", trend: "up" },
        { name: "AI productivity", volume: "8.7M", trend: "up" },
        { name: "Minimalist living", volume: "5.2M", trend: "stable" },
        { name: "Crypto updates", volume: "3.1M", trend: "down" },
        { name: "Skincare routines", volume: "9.8M", trend: "up" },
      ],
      sounds: [
        { name: "Original Audio - TrendWave", uses: "2.1M", platform: "TikTok" },
        { name: "Aesthetic Vibes Mix", uses: "1.8M", platform: "Reels" },
        { name: "Motivation Speech Remix", uses: "956K", platform: "TikTok" },
        { name: "Lo-Fi Productivity", uses: "743K", platform: "YouTube" },
      ],
      hashtags: [
        { tag: "#AItools", posts: "4.2M", growth: 89 },
        { tag: "#MorningRoutine", posts: "12.1M", growth: 34 },
        { tag: "#SideHustle", posts: "8.7M", growth: 56 },
        { tag: "#ContentCreator", posts: "22.3M", growth: 12 },
        { tag: "#ViralTips", posts: "1.9M", growth: 145 },
      ],
    },
  };
}

export async function callAI<T>(
  type: string,
  options: AIRequestOptions
): Promise<AIResponse<T>> {
  switch (type) {
    case "caption":
      return generateCaption(options.topic || "", options.tone || "motivational") as Promise<AIResponse<T>>;
    case "ideas":
      return generateVideoIdeas(options.topic || "") as Promise<AIResponse<T>>;
    case "script":
      return generateScript(options.topic || "", options.duration || "30") as Promise<AIResponse<T>>;
    case "hashtags":
      return generateHashtags(options.topic || "") as Promise<AIResponse<T>>;
    case "analyze":
      return analyzeContent(options.input || "", options.inputType || "caption") as Promise<AIResponse<T>>;
    case "trends":
      return getTrends() as Promise<AIResponse<T>>;
    default:
      throw new Error(`Unknown AI type: ${type}`);
  }
}
