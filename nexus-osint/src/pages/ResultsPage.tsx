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
        <p className="text-zinc-500 font-light">No search query</p>
        <Link to="/" className="text-white text-sm mt-2 inline-block underline underline-offset-4 decoration-white/20">Back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-white transition-colors font-light">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back
      </Link>

      <div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.15em] mb-1">
          {SEARCH_LABELS[type]}
        </p>
        <h1 className="text-xl font-light tracking-tight truncate">{query}</h1>
      </div>

      {isLoading && <ResultSkeleton />}

      {isError && (
        <GlassCard className="text-center py-10">
          <AlertTriangle className="w-6 h-6 text-zinc-500 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-zinc-500 font-light">Search failed</p>
        </GlassCard>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <GlassCard className="flex items-center gap-5">
            <RiskScore score={data.riskScore} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-400 leading-relaxed font-light">{data.summary}</p>
            </div>
          </GlassCard>

          <Section icon={Shield} title="Metadata">
            <div className="grid grid-cols-2 gap-2">
              {data.metadata.map((m) => (
                <div key={m.label} className="rounded-xl border border-white/[0.06] p-3">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-[0.12em]">{m.label}</p>
                  <p className="text-sm font-light mt-1 tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={Users} title="Social Profiles">
            <div className="space-y-1.5">
              {data.socialProfiles.map((p) => (
                <a
                  key={p.platform}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-[10px] text-zinc-500">
                    {p.platform[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light flex items-center gap-1.5">
                      {p.platform}
                      {p.verified && <CheckCircle className="w-3 h-3 text-white" strokeWidth={1.5} />}
                    </p>
                    <p className="text-xs text-zinc-600 truncate">@{p.username}</p>
                  </div>
                  {p.followers && <span className="text-xs text-zinc-600 tabular-nums">{p.followers}</span>}
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-700" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </Section>

          <Section icon={Clock} title="Timeline">
            <div className="space-y-0 relative pl-4 border-l border-white/[0.08]">
              {data.timeline.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative pb-4 last:pb-0"
                >
                  <div className="absolute -left-[17px] w-2 h-2 rounded-full bg-white/40 top-1" />
                  <p className="text-[10px] text-zinc-600 tabular-nums">{e.date}</p>
                  <p className="text-sm font-light">{e.title}</p>
                  <p className="text-xs text-zinc-600 font-light">{e.description}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          <Section icon={MapPin} title="Geolocation">
            <div className="rounded-xl border border-white/[0.06] h-32 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="relative text-center">
                <MapPin className="w-5 h-5 text-zinc-500 mx-auto mb-1" strokeWidth={1.5} />
                <p className="text-sm font-light">{data.location?.label}</p>
              </div>
            </div>
          </Section>

          <Section icon={Globe} title="Connected Domains">
            <div className="flex flex-wrap gap-1.5">
              {data.connectedDomains.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono text-zinc-400">{d}</span>
              ))}
            </div>
          </Section>

          <Section icon={Server} title="Technology Stack">
            <div className="flex flex-wrap gap-1.5">
              {data.technologyStack.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-lg border border-white/10 text-xs text-zinc-400">{t}</span>
              ))}
            </div>
          </Section>

          <Section icon={Users} title="Related Usernames">
            <div className="flex flex-wrap gap-1.5">
              {data.relatedUsernames.map((u) => (
                <button
                  key={u}
                  onClick={() => toast(`Search "${u}" from home`, "info")}
                  className="px-2.5 py-1 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  @{u}
                </button>
              ))}
            </div>
          </Section>

          <Section icon={Shield} title="Public Information">
            <ul className="space-y-2">
              {data.publicInfo.map((info, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-500 font-light">
                  <span className="text-zinc-700 mt-0.5">—</span>{info}
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
        <Icon className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">{title}</h2>
      </div>
      {children}
    </GlassCard>
  );
}
