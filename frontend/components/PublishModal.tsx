"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

interface SocialStatus {
  instagram: { connected: boolean; username?: string; user_id?: string };
  youtube: { connected: boolean; channel_id?: string };
}

interface Props {
  platform: "instagram" | "youtube";
  projectId: string;
  initialCaption: string;
  initialHashtags: string[];
  videoTitle?: string;
  userPlan?: string;
  onClose: () => void;
  onSuccess: (platform: string) => void;
}

export default function PublishModal({
  platform,
  projectId,
  initialCaption,
  initialHashtags,
  videoTitle,
  userPlan,
  onClose,
  onSuccess,
}: Props) {
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags.join(" "));
  const [title, setTitle] = useState(videoTitle || "");
  const [loading, setLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null); // queued | processing | published | failed
  const [publishError, setPublishError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isIG = platform === "instagram";
  const platformLabel = isIG ? "Instagram" : "YouTube";
  const platformIcon = isIG ? "📸" : "▶️";

  const fetchStatus = () => {
    setStatusLoading(true);
    api.get("/social/status")
      .then((r) => setSocialStatus(r.data))
      .catch(() => setSocialStatus(null))
      .finally(() => setStatusLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Listen for postMessage from OAuth popup callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "ig_connected" || e.data?.type === "yt_connected") {
        setConnecting(false);
        fetchStatus();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const isConnected = isIG
    ? socialStatus?.instagram?.connected
    : socialStatus?.youtube?.connected;

  const connectedLabel = isIG
    ? socialStatus?.instagram?.username ? `@${socialStatus.instagram.username}` : "Connected"
    : socialStatus?.youtube?.channel_id ? "Channel connected" : "Connected";

  const handleConnect = () => {
    const endpoint = isIG ? "/social/instagram/connect" : "/social/youtube/connect";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    const url = `${apiBase}/api/v1${endpoint}?token=${token}`;

    const popup = window.open(url, "social_auth", "width=600,height=700,scrollbars=yes");
    popupRef.current = popup;
    setConnecting(true);

    // Poll popup closed (fallback if postMessage doesn't fire)
    const poll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(poll);
        setConnecting(false);
        fetchStatus();
      }
    }, 800);
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setPublishError(null);
    try {
      const hashtagList = hashtags.split(/\s+/).filter((h) => h.startsWith("#"));
      const endpoint = isIG ? "/social/instagram/publish" : "/social/youtube/publish";

      const { data } = await api.post(endpoint, {
        project_id: projectId,
        caption,
        hashtags: hashtagList,
        ...(platform === "youtube" ? { title: title || caption.slice(0, 100) } : {}),
      });

      setPublishStatus("queued");
      const jobId = data.publish_job_id;

      // Poll until published or failed
      pollRef.current = setInterval(async () => {
        try {
          const { data: statusData } = await api.get(`/social/publish/${jobId}`);
          setPublishStatus(statusData.status);
          if (statusData.status === "published") {
            clearInterval(pollRef.current!);
            setLoading(false);
            onSuccess(platform);
          } else if (statusData.status === "failed") {
            clearInterval(pollRef.current!);
            setLoading(false);
            setPublishError(statusData.error_message || "Publish failed.");
          }
        } catch {
          // poll silently
        }
      }, 3000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Publish failed. Try again.");
      setLoading(false);
    }
  };

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: 480,
        background: "var(--card)", border: "2px solid var(--ink)",
        borderRadius: "var(--r-md)", boxShadow: "6px 6px 0 var(--ink)",
        padding: 28,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
            {platformIcon} Post to {platformLabel}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--muted)" }}>✕</button>
        </div>

        {statusLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <div className="spin" style={{ width: 28, height: 28, border: "3px solid var(--bg-2)", borderTopColor: "var(--orange)", borderRadius: "50%" }} />
          </div>
        ) : !isConnected ? (
          /* ── Not connected ── */
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{platformIcon}</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)", marginBottom: 8 }}>
              Connect {platformLabel}
            </h3>
            <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              {isIG
                ? "Log in with your Instagram account. We only post when you click — we never post automatically."
                : "Connect your YouTube channel. We only upload when you click publish."}
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: "14px 32px", borderRadius: "var(--r-sm)",
                fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
                cursor: connecting ? "wait" : "pointer",
                border: "2px solid var(--ink)",
                background: isIG ? "#E1306C" : "#FF0000",
                color: "#fff",
                boxShadow: "3px 3px 0 var(--ink)",
                opacity: connecting ? 0.7 : 1,
              }}
            >
              {connecting ? "Waiting for authorisation…" : `Connect ${platformLabel} →`}
            </button>
            {connecting && (
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>
                A popup opened — complete login there. This will update automatically.
              </p>
            )}
          </div>
        ) : (
          /* ── Connected — publish form ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {userPlan === "free" && isIG && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,165,0,0.1)", border: "2px solid var(--orange)",
                borderRadius: "var(--r-sm)", padding: "10px 14px",
              }}>
                <span style={{ fontSize: 16 }}>💧</span>
                <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4 }}>
                  <strong style={{ color: "var(--ink)" }}>Free plan:</strong> video will include a ReelCraft watermark.{" "}
                  <a href="/pricing" style={{ color: "var(--orange)", fontWeight: 700, textDecoration: "none" }}>Upgrade to remove →</a>
                </span>
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-2)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-sm)", padding: "8px 14px",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
                  {connectedLabel}
                </span>
              </div>
              <button
                onClick={async () => {
                  await api.delete(`/social/${platform}/disconnect`);
                  fetchStatus();
                }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)" }}
              >
                Disconnect
              </button>
            </div>

            {platform === "youtube" && (
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>
                  Video Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter YouTube title..."
                  maxLength={100}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "2px solid var(--ink)", background: "var(--bg-2)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>
                {isIG ? "Caption / Description" : "Description"}
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={isIG ? "Write your post caption..." : "Write your video description..."}
                style={{ width: "100%", height: 100, padding: "10px 14px", borderRadius: "var(--r-sm)", border: "2px solid var(--ink)", background: "var(--bg-2)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>
                Hashtags
              </label>
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2 ..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "2px solid var(--ink)", background: "var(--bg-2)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" }}
              />
            </div>

            {(error || publishError) && (
              <div style={{ background: "rgba(255,50,50,0.1)", border: "2px solid var(--pink)", borderRadius: "var(--r-sm)", padding: "10px 14px", color: "var(--pink)", fontSize: 13 }}>
                {error || publishError}
              </div>
            )}

            {publishStatus && publishStatus !== "published" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--bg-2)", border: "2px solid var(--ink)",
                borderRadius: "var(--r-sm)", padding: "10px 14px",
              }}>
                <div className="spin" style={{ width: 14, height: 14, border: "2px solid var(--orange-lt)", borderTopColor: "var(--orange)", borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", color: "var(--ink-2)" }}>
                  {publishStatus === "queued" ? "Queued — waiting for worker..." : "Publishing to " + platformLabel + "..."}
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: "12px", borderRadius: "var(--r-sm)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "2px solid var(--ink)", background: "var(--bg-2)", color: "var(--ink)" }}
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || !!publishStatus}
                style={{ flex: 2, padding: "12px", borderRadius: "var(--r-sm)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14, cursor: (loading || !!publishStatus) ? "wait" : "pointer", border: "2px solid var(--ink)", background: "var(--orange)", color: "#fff", boxShadow: "3px 3px 0 var(--ink)", opacity: (loading || !!publishStatus) ? 0.7 : 1 }}
              >
                {loading ? "Submitting…" : `Post to ${platformLabel} →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
