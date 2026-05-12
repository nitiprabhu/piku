"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useJobProgress } from "@/lib/websocket";
import PublishModal from "@/components/PublishModal";
import AppShell from "@/components/AppShell";

const STEP_LABELS: Record<string, string> = {
  connecting: "Connecting...",
  generating_script: "Writing your script with AI...",
  script_done: "Script ready! Generating voice...",
  generating_voice: "Creating AI voiceover...",
  voice_done: "Voice done! Generating video clips...",
  generating_visuals: "Generating cinematic video clips...",
  visuals_done: "Clips ready! Composing final video...",
  composing: "Mixing everything with FFmpeg...",
  completed: "Your reel is ready! 🎉",
  failed: "Generation failed",
  error: "Connection error",
};

const STEPS = [
  { label: "AI Script",   pct: 20 },
  { label: "Voiceover",   pct: 40 },
  { label: "Video Clips", pct: 70 },
  { label: "Final Edit",  pct: 100 },
];

function ViralScore({ score }: { score: number }) {
  const segments = Array.from({ length: 10 }, (_, i) => {
    const threshold = (i + 1) * 10;
    const filled = score >= threshold;
    const color = score >= 80 ? "var(--green)" : score >= 60 ? "var(--orange)" : "var(--pink)";
    return (
      <div
        key={i}
        style={{
          flex: 1,
          height: 20,
          background: filled ? color : "var(--bg-2)",
          border: "2px solid var(--ink)",
          borderRadius: i === 0 ? "6px 0 0 6px" : i === 9 ? "0 6px 6px 0" : 0,
          marginLeft: i > 0 ? -2 : 0,
        }}
      />
    );
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)", lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>/100 VIRAL SCORE</span>
      </div>
      <div style={{ display: "flex" }}>{segments}</div>
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;
  const jobId = searchParams.get("job_id");

  const progress = useJobProgress(jobId);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [publishModal, setPublishModal] = useState<"instagram" | "youtube" | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (progress?.event === "completed" || !jobId) {
      fetchProject();
    }
  }, [progress?.event, jobId]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setProject(data);
      setCaption(data.caption_text || "");
      setHashtags((data.hashtags || []).join(" "));
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const saveCaption = async () => {
    setSaving(true);
    try {
      await api.patch(`/projects/${projectId}`, {
        caption,
        hashtags: hashtags.split(/\s+/).filter((h) => h.startsWith("#")),
      });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {}
    setSaving(false);
  };

  const isGenerating = jobId && progress?.event !== "completed" && progress?.event !== "failed";
  const videoUrl = progress?.video_url || project?.video_url;
  const viralScore = progress?.viral_score ?? project?.viral_score;
  const pct = progress?.percent || 0;

  if (isGenerating) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
            {/* Phone mockup */}
            <div className="phone-frame" style={{
              width: 200, height: 355, margin: "0 auto 32px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 12,
            }}>
              <div className="spin" style={{
                width: 56, height: 56,
                border: "4px solid var(--orange-lt)",
                borderTopColor: "var(--orange)",
                borderRadius: "50%",
              }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>
                {pct}%
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                {STEP_LABELS[progress?.step || "connecting"] || progress?.step}
              </span>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>
              CREATING YOUR REEL
            </h1>
            <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 24 }}>Takes about 45 seconds</p>

            {/* Progress bar */}
            <div style={{
              height: 12, background: "var(--bg-2)", border: "2px solid var(--ink)",
              borderRadius: 999, overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: "var(--orange)",
                transition: "width 0.7s ease-out",
              }} />
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
              {STEPS.map((s) => {
                const done = pct >= s.pct;
                const active = pct >= s.pct - 30 && pct < s.pct;
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      border: "2px solid var(--ink)",
                      background: done ? "var(--orange)" : active ? "var(--orange-lt)" : "var(--bg-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: done ? "#fff" : "var(--ink)",
                      boxShadow: done ? "var(--shadow-sm)" : "none",
                    }}>
                      {done ? "✓" : active ? "…" : ""}
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: 14,
                      color: done ? "var(--ink)" : "var(--muted)",
                    }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (progress?.event === "failed") {
    const errorFirst = progress.error?.split("\n")[0] || "Something went wrong during generation.";
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>GENERATION FAILED</h1>
            <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 16 }}>Your credit has been refunded automatically.</p>
            {progress.error && (
              <details style={{ marginBottom: 24, textAlign: "left" }}>
                <summary style={{ cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                  Error details
                </summary>
                <div style={{
                  background: "var(--bg-2)", border: "2px solid var(--ink)",
                  borderRadius: "var(--r-sm)", padding: "12px 14px",
                  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--pink)",
                  maxHeight: 160, overflowY: "auto", lineHeight: 1.6,
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {errorFirst}
                </div>
              </details>
            )}
            <Link href="/create" className="btn-hard" style={{ padding: "12px 28px", fontSize: 15 }}>Try Again</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loading && !videoUrl) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)" }}>
          <div className="spin" style={{ width: 40, height: 40, border: "3px solid var(--orange-lt)", borderTopColor: "var(--orange)", borderRadius: "50%" }} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, fontFamily: "var(--font-mono)", fontSize: 13 }}>
          <Link href="/dashboard" style={{ color: "var(--muted)", textDecoration: "none" }}>Dashboard</Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 700 }}>{project?.title || "Untitled Reel"}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 28, alignItems: "start" }}>
          {/* Phone preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="phone-frame" style={{ width: "100%" }}>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "calc(var(--r-lg) - 2px)" }}
                  poster={project?.thumbnail_url}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🎬</div>
              )}
            </div>

            {viralScore != null && (
              <div className="card" style={{ padding: 20 }}>
                <ViralScore score={viralScore} />
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Actions */}
            <div className="card">
              <div className="section-label" style={{ marginBottom: 16 }}>Actions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {videoUrl && (
                  <button
                    className="btn-hard"
                    style={{ fontSize: 14, padding: "10px 16px", justifyContent: "center" }}
                    onClick={async () => {
                      const res = await fetch(videoUrl);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `reelcraft-${projectId}.mp4`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    ⬇️ Download MP4
                  </button>
                )}
                <Link
                  href="/create"
                  className="btn-hard"
                  style={{ fontSize: 14, padding: "10px 16px", justifyContent: "center", background: "var(--card)", color: "var(--ink)", textAlign: "center" }}
                >
                  🔄 New Reel
                </Link>
                <button
                  className="btn-hard"
                  style={{ fontSize: 14, padding: "10px 16px", justifyContent: "center", gridColumn: "1 / -1", background: "#E1306C" }}
                  onClick={() => setPublishModal("instagram")}
                  disabled={!videoUrl}
                >
                  📸 Post to Instagram
                </button>
                <button
                  className="btn-hard"
                  style={{ fontSize: 14, padding: "10px 16px", justifyContent: "center", gridColumn: "1 / -1", background: "#FF0000" }}
                  onClick={() => setPublishModal("youtube")}
                  disabled={!videoUrl}
                >
                  ▶️ Post to YouTube Shorts
                </button>
                {publishSuccess && (
                  <div style={{
                    gridColumn: "1 / -1",
                    background: "var(--bg-2)", border: "2px solid var(--green)",
                    borderRadius: "var(--r-sm)", padding: "10px 14px",
                    fontSize: 14, color: "var(--green)", fontWeight: 700, textAlign: "center",
                  }}>
                    🎉 Posted to {publishSuccess}!
                  </div>
                )}
              </div>
            </div>

            {/* Caption editor */}
            <div className="card">
              <div className="section-label" style={{ marginBottom: 16 }}>Caption & Hashtags</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Edit your caption..."
                  className="input-field"
                  style={{ height: 100, resize: "none", fontSize: 14 }}
                />
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#hashtag1 #hashtag2 ..."
                  className="input-field"
                  style={{ fontSize: 14 }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={saveCaption}
                    disabled={saving}
                    className="btn-hard"
                    style={{ fontSize: 14, padding: "10px 20px" }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  {saveMsg && (
                    <span style={{ color: "var(--green)", fontSize: 14, fontWeight: 700 }}>{saveMsg}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Script highlights */}
            {project?.script_json?.hook && (
              <div className="card">
                <div className="section-label" style={{ marginBottom: 16 }}>AI Script Highlights</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{
                    background: "var(--orange-lt)", border: "2px solid var(--orange)",
                    borderRadius: "var(--r-sm)", padding: "12px 16px",
                  }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 6 }}>
                      Hook (First 3 sec)
                    </div>
                    <p style={{ fontSize: 14, color: "var(--ink)", margin: 0 }}>{project.script_json.hook}</p>
                  </div>
                  {project.script_json.narration && (
                    <div style={{
                      background: "var(--bg-2)", border: "2px solid var(--ink)",
                      borderRadius: "var(--r-sm)", padding: "12px 16px",
                    }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>
                        Full Narration
                      </div>
                      <p style={{
                        fontSize: 14, color: "var(--ink-2)", margin: 0,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 4, WebkitBoxOrient: "vertical",
                      }}>{project.script_json.narration}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {publishModal && (
        <PublishModal
          platform={publishModal}
          projectId={projectId}
          initialCaption={caption}
          initialHashtags={hashtags.split(/\s+/).filter((h) => h.startsWith("#"))}
          videoTitle={project?.title}
          onClose={() => setPublishModal(null)}
          onSuccess={(p) => {
            setPublishModal(null);
            setPublishSuccess(p === "instagram" ? "Instagram" : "YouTube");
          }}
        />
      )}
    </AppShell>
  );
}
