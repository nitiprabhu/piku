"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useJobProgress } from "@/lib/websocket";
import AppShell from "@/components/AppShell";

interface Series {
  id: string;
  name: string;
  topic: string;
  style: string;
  language: string;
  voice_id: string;
  duration_target: number;
  episode_count: number;
  caption_mode: string;
  schedule_type: string;
  schedule_time: string;
  next_run_at: string | null;
}

interface Episode {
  id: string;
  episode_number: number;
  generated_prompt: string;
  project_id: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  completed: "#10B981",
  processing: "#F59E0B",
  pending: "#6B7280",
  failed: "#EF4444",
};

const SCHEDULE_OPTIONS = [
  { value: "manual", label: "Manual only" },
  { value: "daily", label: "Daily" },
  { value: "every_3_days", label: "Every 3 days" },
  { value: "weekly", label: "Weekly" },
];

function ProgressBar({ jobId, onComplete }: { jobId: string | null; onComplete: () => void }) {
  const progress = useJobProgress(jobId);

  useEffect(() => {
    if (progress?.event === "completed") onComplete();
  }, [progress?.event, onComplete]);

  if (!jobId || !progress) return null;

  return (
    <div style={{
      background: "var(--bg-2)", border: "2px solid var(--ink)",
      borderRadius: "var(--r-sm)", padding: "12px 16px", marginTop: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", color: "var(--ink-2)" }}>
          {progress.step.replace(/_/g, " ")}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--orange)" }}>
          {progress.percent}%
        </span>
      </div>
      <div style={{ background: "var(--ink)", borderRadius: 999, height: 6, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "var(--orange)",
          width: `${progress.percent}%`, transition: "width 0.4s ease",
        }} />
      </div>
      {progress.event === "completed" && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#10B981", marginTop: 8 }}>
          Episode generated!
        </div>
      )}
      {progress.event === "failed" && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#EF4444", marginTop: 8 }}>
          {progress.error || "Generation failed"}
        </div>
      )}
    </div>
  );
}

function SchedulePanel({ series, onSaved }: { series: Series; onSaved: (s: Series) => void }) {
  const [scheduleType, setScheduleType] = useState(series.schedule_type);
  const [scheduleTime, setScheduleTime] = useState(series.schedule_time);
  const [captionMode, setCaptionMode] = useState(series.caption_mode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`/series/${series.id}/schedule`, {
        schedule_type: scheduleType,
        schedule_time: scheduleTime,
        caption_mode: captionMode,
      });
      onSaved(r.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = {
    display: "block", fontFamily: "var(--font-mono)", fontSize: 10,
    textTransform: "uppercase" as const, letterSpacing: "0.1em",
    color: "var(--muted)", marginBottom: 4,
  };
  const selectStyle = {
    padding: "7px 10px", fontFamily: "var(--font-body)", fontSize: 13,
    color: "var(--ink)", background: "var(--bg-2)",
    border: "1.5px solid var(--ink)", borderRadius: "var(--r-sm)", outline: "none",
  };

  return (
    <div style={{
      border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
      background: "var(--card)", padding: "18px 20px", marginTop: 20,
    }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 14 }}>
        Auto-Schedule & Style
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Frequency</label>
          <select style={selectStyle} value={scheduleType} onChange={e => setScheduleType(e.target.value)}>
            {SCHEDULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Time (IST)</label>
          <input
            type="time"
            style={{ ...selectStyle, width: "100%" }}
            value={scheduleTime}
            onChange={e => setScheduleTime(e.target.value)}
            disabled={scheduleType === "manual"}
          />
        </div>
        <div>
          <label style={labelStyle}>Caption Style</label>
          <select style={selectStyle} value={captionMode} onChange={e => setCaptionMode(e.target.value)}>
            <option value="full_sentence">Full sentence</option>
            <option value="keyword_pop">Keyword pop</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "7px 16px",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
              color: "#fff", background: saved ? "#10B981" : saving ? "var(--muted)" : "var(--orange)",
              border: "1.5px solid var(--ink)", borderRadius: "var(--r-sm)",
              boxShadow: "2px 2px 0 var(--ink)", cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saved ? "Saved ✓" : saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {series.next_run_at && scheduleType !== "manual" && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-2)" }}>
          Next episode: {new Date(series.next_run_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [sRes, eRes] = await Promise.all([
        api.get(`/series/${id}`),
        api.get(`/series/${id}/episodes`),
      ]);
      setSeries(sRes.data);
      setEpisodes(eRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const r = await api.post(`/series/${id}/generate`);
      setActiveJobId(r.data.job_id);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to generate episode";
      setError(msg);
      setGenerating(false);
    }
  };

  const handleComplete = async () => {
    setGenerating(false);
    setActiveJobId(null);
    await load();
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: 60, textAlign: "center", fontFamily: "var(--font-body)", color: "var(--ink-2)" }}>
          Loading...
        </div>
      </AppShell>
    );
  }

  if (!series) {
    return (
      <AppShell>
        <div style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-body)", color: "var(--ink-2)" }}>Series not found.</div>
          <Link href="/series" style={{ color: "var(--orange)" }}>← Back to Series</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
    <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/series" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}>
          ← Back to Series
        </Link>
      </div>

      <div style={{
        background: "var(--card)", border: "2px solid var(--ink)",
        borderRadius: "var(--r-md)", boxShadow: "4px 4px 0 var(--ink)",
        padding: "24px 28px", marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", margin: "0 0 8px" }}>
              {series.name}
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-2)", margin: "0 0 16px", lineHeight: 1.5 }}>
              {series.topic}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[series.style, series.language, `${series.duration_target}s`, series.caption_mode.replace("_", " ")].map((tag) => (
                <span key={tag} style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: "var(--bg-2)", border: "1.5px solid var(--ink)",
                  borderRadius: 999, padding: "2px 10px", color: "var(--ink-2)",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)" }}>
              {series.episode_count}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
              episodes
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: "11px 24px",
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
              color: "#fff", background: generating ? "var(--muted)" : "var(--orange)",
              border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
              boxShadow: generating ? "none" : "3px 3px 0 var(--ink)",
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? "Generating..." : `Generate Episode ${series.episode_count + 1} →`}
          </button>

          {error && (
            <div style={{
              marginTop: 12, fontFamily: "var(--font-body)", fontSize: 14,
              color: "#B91C1C", background: "#FEF2F2",
              border: "2px solid #EF4444", borderRadius: "var(--r-sm)", padding: "8px 14px",
            }}>
              {error}
            </div>
          )}

          <ProgressBar jobId={activeJobId} onComplete={handleComplete} />
        </div>

        <SchedulePanel series={series} onSaved={setSeries} />
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
        Episodes
      </h2>

      {episodes.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 24px",
          border: "2px dashed var(--ink)", borderRadius: "var(--r-md)",
          background: "var(--card)",
          fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink-2)",
        }}>
          No episodes yet. Generate your first episode above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...episodes].reverse().map((ep) => (
            <div
              key={ep.id}
              style={{
                background: "var(--card)", border: "2px solid var(--ink)",
                borderRadius: "var(--r-sm)", boxShadow: "2px 2px 0 var(--ink)",
                padding: "16px 20px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 800, color: "var(--orange)" }}>
                    EP {ep.episode_number}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    background: STATUS_COLOR[ep.status] || "#6B7280",
                    color: "#fff", padding: "1px 8px", borderRadius: 999,
                    border: "1.5px solid var(--ink)",
                  }}>
                    {ep.status}
                  </span>
                </div>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-2)",
                  margin: 0, lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {ep.generated_prompt}
                </p>
              </div>
              {ep.project_id && ep.status === "completed" && (
                <Link
                  href={`/projects/${ep.project_id}`}
                  style={{
                    flexShrink: 0, padding: "6px 14px",
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
                    color: "var(--ink)", background: "var(--bg-2)",
                    border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
                    boxShadow: "2px 2px 0 var(--ink)", textDecoration: "none",
                  }}
                >
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </AppShell>
  );
}
