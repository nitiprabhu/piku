"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface SocialStatus {
  instagram: { connected: boolean; user_id?: string };
  youtube: { connected: boolean; channel_id?: string };
}

interface Props {
  platform: "instagram" | "youtube";
  projectId: string;
  initialCaption: string;
  initialHashtags: string[];
  videoTitle?: string;
  onClose: () => void;
  onSuccess: (platform: string) => void;
}

export default function PublishModal({
  platform,
  projectId,
  initialCaption,
  initialHashtags,
  videoTitle,
  onClose,
  onSuccess,
}: Props) {
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags.join(" "));
  const [title, setTitle] = useState(videoTitle || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const isIG = platform === "instagram";
  const platformLabel = isIG ? "Instagram" : "YouTube";
  const platformIcon = isIG ? "📸" : "▶️";

  useEffect(() => {
    api.get("/social/status")
      .then((r) => setSocialStatus(r.data))
      .catch(() => setSocialStatus(null))
      .finally(() => setStatusLoading(false));
  }, []);

  const isConnected = isIG
    ? socialStatus?.instagram?.connected
    : socialStatus?.youtube?.connected;

  const handleConnect = () => {
    const endpoint = isIG ? "/social/instagram/connect" : "/social/youtube/connect";
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";
    const token = localStorage.getItem("access_token");
    window.location.href = `${apiBase}/api/v1${endpoint}?token=${token}`;
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const hashtagList = hashtags
        .split(/\s+/)
        .filter((h) => h.startsWith("#"));

      const endpoint = isIG
        ? "/social/instagram/publish"
        : "/social/youtube/publish";

      await api.post(endpoint, {
        project_id: projectId,
        caption,
        hashtags: hashtagList,
        ...(platform === "youtube" ? { title: title || caption.slice(0, 100) } : {}),
      });

      onSuccess(platform);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Publish failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg glass p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {platformIcon} Post to {platformLabel}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {statusLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : !isConnected ? (
          /* Not connected — show connect CTA */
          <div className="text-center py-6 space-y-4">
            <div className="text-5xl">{platformIcon}</div>
            <p className="text-white/60 text-sm">
              Connect your {platformLabel} account to publish directly from ReelCraft.
            </p>
            <button onClick={handleConnect} className="btn-primary px-8 py-3">
              Connect {platformLabel} →
            </button>
          </div>
        ) : (
          /* Connected — show publish form */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {platformLabel} connected
            </div>

            {platform === "youtube" && (
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                  Video Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter YouTube title..."
                  className="input-field text-sm"
                  maxLength={100}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="input-field h-24 resize-none text-sm"
                placeholder="Write your caption..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Hashtags
              </label>
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="input-field text-sm"
                placeholder="#hashtag1 #hashtag2 ..."
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="btn-primary flex-1 py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </span>
                ) : (
                  `Post to ${platformLabel} →`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
