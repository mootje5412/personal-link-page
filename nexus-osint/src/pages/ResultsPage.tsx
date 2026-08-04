"use client";

import type { ReactNode } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, MapPin, Server, Users, Globe,
  Clock, Shield, CheckCircle, AlertTriangle,
} from "lucide-react";
import { executeSearch } from "@/api";
import { RiskScore } from "@/components/ui/RiskScore";
import { GlassCard } from "@/components/ui/GlassCard";
import { ResultSkeleton } from "@/components/ui/Skeleton";
import { SEARCH_LABELS, type SearchType } from "@/types/search";
import { useToast } from "@/contexts/ToastContext";

export default function ResultsPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const type = (params.get("type") || "username") as SearchType;
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["search", query, type],
    queryFn: () => executeSearch(query, type),
    enabled: Boolean(query),
  });

  if (!query) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">No search query provided</p>
        <Link to="/" className="text-blue-400 text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <div>
        <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">
          {SEARCH_LABELS[type]} Intelligence
        </p>
        <h1 className="text-xl font-bold truncate">{query}</h1>
      </div>

      {isLoading && <ResultSkeleton />}

      {isError && (
        <GlassCard className="text-center py-10">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Search failed. Please try again.</p>
        </GlassCard>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <GlassCard glow="blue" className="flex items-center gap-5">
            <RiskScore score={data.riskScore} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>
            </div>
          </GlassCard>

          {/* Metadata */}
          <Section icon={Shield} title="Metadata">
            <div className="grid grid-cols-2 gap-2">
              {data.metadata.map((m) => (
                <div key={m.label} className="glass rounded-xl p-3">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-sm font-medium mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Social Profiles */}
          <Section icon={Users} title="Social Profiles">
            <div className="space-y-2">
              {data.socialProfiles.map((p) => (
                <a
                  key={p.platform}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 glass rounded-xl p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400">
                    {p.platform[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1">
                      {p.platform}
                      {p.verified && <CheckCircle className="w-3 h-3 text-blue-400" />}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">@{p.username}</p>
                  </div>
                  {p.followers && <span className="text-xs text-zinc-500">{p.followers}</span>}
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                </a>
              ))}
            </div>
          </Section>

          {/* Timeline */}
          <Section icon={Clock} title="Timeline">
            <div className="space-y-0 relative pl-4 border-l border-white/10">
              {data.timeline.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative pb-4 last:pb-0"
                >
                  <div className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full ${e.type === "warning" ? "bg-amber-400" : e.type === "critical" ? "bg-red-400" : "bg-blue-400"}`} />
                  <p className="text-[10px] text-zinc-500">{e.date}</p>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-zinc-400">{e.description}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Map placeholder */}
          <Section icon={MapPin} title="Geolocation">
            <div className="glass rounded-2xl h-36 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-50" />
              <div className="relative text-center">
                <MapPin className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <p className="text-sm font-medium">{data.location?.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Map integration placeholder</p>
              </div>
            </div>
          </Section>

          {/* Connected domains & tech */}
          <Section icon={Globe} title="Connected Domains">
            <div className="flex flex-wrap gap-2">
              {data.connectedDomains.map((d) => (
                <span key={d} className="px-3 py-1.5 rounded-xl glass text-xs font-mono text-blue-300">{d}</span>
              ))}
            </div>
          </Section>

          <Section icon={Server} title="Technology Stack">
            <div className="flex flex-wrap gap-2">
              {data.technologyStack.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">{t}</span>
              ))}
            </div>
          </Section>

          {/* Related usernames */}
          <Section icon={Users} title="Related Usernames">
            <div className="flex flex-wrap gap-2">
              {data.relatedUsernames.map((u) => (
                <button
                  key={u}
                  onClick={() => toast(`Search "${u}" from home`, "info")}
                  className="px-3 py-1.5 rounded-xl glass text-xs hover:bg-white/5 transition-colors"
                >
                  @{u}
                </button>
              ))}
            </div>
          </Section>

          {/* Public info */}
          <Section icon={Shield} title="Public Information">
            <ul className="space-y-2">
              {data.publicInfo.map((info, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-blue-400 mt-1">•</span>{info}
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </GlassCard>
  );
}
